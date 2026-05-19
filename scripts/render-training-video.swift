import AppKit
import AVFoundation
import CoreVideo
import Foundation

struct TrainingSpec: Codable {
    let title: String
    let subtitle: String
    let outputPath: String
    let workspacePath: String
    let width: Int
    let height: Int
    let fps: Int
    let speechRate: Int
    let slides: [SlideSpec]
}

struct SlideSpec: Codable {
    let chapter: String
    let title: String
    let bullets: [String]
    let narration: String
}

struct RenderedSlide {
    let spec: SlideSpec
    let audioURL: URL
    let duration: Double
    let start: Double
}

enum RenderError: Error, CustomStringConvertible {
    case invalidArguments
    case cannotReadSpec(String)
    case cannotCreateWriter
    case cannotAddVideoInput
    case cannotCreatePixelBuffer
    case audioGenerationFailed(String)
    case missingVideoTrack
    case missingAudioTrack(String)
    case exportFailed(String)

    var description: String {
        switch self {
        case .invalidArguments:
            return "Usage: swift scripts/render-training-video.swift <spec.json>"
        case .cannotReadSpec(let path):
            return "Could not read training spec at \(path)"
        case .cannotCreateWriter:
            return "Could not create AVAssetWriter"
        case .cannotAddVideoInput:
            return "Could not add video input"
        case .cannotCreatePixelBuffer:
            return "Could not create pixel buffer"
        case .audioGenerationFailed(let message):
            return "Audio generation failed: \(message)"
        case .missingVideoTrack:
            return "Silent video did not contain a video track"
        case .missingAudioTrack(let path):
            return "Audio file did not contain an audio track: \(path)"
        case .exportFailed(let message):
            return "Video export failed: \(message)"
        }
    }
}

func shell(_ executable: String, _ arguments: [String]) throws {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: executable)
    process.arguments = arguments
    let stderr = Pipe()
    process.standardError = stderr
    try process.run()
    process.waitUntilExit()

    if process.terminationStatus != 0 {
        let data = stderr.fileHandleForReading.readDataToEndOfFile()
        let message = String(data: data, encoding: .utf8) ?? "exit \(process.terminationStatus)"
        throw RenderError.audioGenerationFailed(message)
    }
}

func loadSpec(from path: String) throws -> TrainingSpec {
    guard let data = FileManager.default.contents(atPath: path) else {
        throw RenderError.cannotReadSpec(path)
    }

    return try JSONDecoder().decode(TrainingSpec.self, from: data)
}

func ensureCleanDirectory(_ url: URL) throws {
    let fileManager = FileManager.default

    if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
    }

    try fileManager.createDirectory(at: url, withIntermediateDirectories: true)
}

func writeText(_ text: String, to url: URL) throws {
    try FileManager.default.createDirectory(
        at: url.deletingLastPathComponent(),
        withIntermediateDirectories: true
    )
    try text.write(to: url, atomically: true, encoding: .utf8)
}

func durationOfAudio(_ url: URL) -> Double {
    let asset = AVURLAsset(url: url)
    let seconds = CMTimeGetSeconds(asset.duration)
    return seconds.isFinite && seconds > 0 ? seconds : 8
}

func generateSlideAudio(spec: TrainingSpec, workspace: URL) throws -> [RenderedSlide] {
    let audioDir = workspace.appendingPathComponent("audio")
    try FileManager.default.createDirectory(at: audioDir, withIntermediateDirectories: true)

    var rendered: [RenderedSlide] = []
    var start = 0.0

    for (index, slide) in spec.slides.enumerated() {
        let textURL = audioDir.appendingPathComponent(String(format: "slide-%02d.txt", index + 1))
        let audioURL = audioDir.appendingPathComponent(String(format: "slide-%02d.aiff", index + 1))
        let narration = "\(slide.chapter). \(slide.title).\n\n\(slide.narration)"
        try writeText(narration, to: textURL)
        try shell("/usr/bin/say", [
            "-r", String(spec.speechRate),
            "-o", audioURL.path,
            "-f", textURL.path
        ])
        let duration = max(6, durationOfAudio(audioURL) + 0.75)
        rendered.append(RenderedSlide(spec: slide, audioURL: audioURL, duration: duration, start: start))
        start += duration
    }

    return rendered
}

func drawText(
    _ text: String,
    in rect: CGRect,
    font: NSFont,
    color: NSColor,
    alignment: NSTextAlignment = .left,
    lineHeight: CGFloat = 1.08
) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    paragraph.lineBreakMode = .byWordWrapping
    paragraph.lineHeightMultiple = lineHeight
    let attributes: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: color,
        .paragraphStyle: paragraph
    ]
    NSAttributedString(string: text, attributes: attributes).draw(
        with: rect,
        options: [.usesLineFragmentOrigin, .usesFontLeading],
        context: nil
    )
}

func drawSlide(
    context: CGContext,
    width: Int,
    height: Int,
    slide: SlideSpec,
    index: Int,
    count: Int,
    progress: CGFloat,
    title: String,
    subtitle: String
) {
    let w = CGFloat(width)
    let h = CGFloat(height)
    let margin: CGFloat = 72

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)

    NSColor(calibratedRed: 0.965, green: 0.972, blue: 0.984, alpha: 1).setFill()
    CGRect(x: 0, y: 0, width: w, height: h).fill()

    NSColor(calibratedRed: 0.067, green: 0.094, blue: 0.153, alpha: 1).setFill()
    CGRect(x: 0, y: h - 130, width: w, height: 130).fill()

    drawText(
        title,
        in: CGRect(x: margin, y: h - 72, width: w - (margin * 2), height: 34),
        font: NSFont.systemFont(ofSize: 26, weight: .bold),
        color: .white
    )
    drawText(
        subtitle,
        in: CGRect(x: margin, y: h - 112, width: w - (margin * 2), height: 28),
        font: NSFont.systemFont(ofSize: 16, weight: .medium),
        color: NSColor(calibratedRed: 0.81, green: 0.86, blue: 0.94, alpha: 1)
    )

    drawText(
        "Chapter \(index + 1) of \(count)  |  \(slide.chapter)",
        in: CGRect(x: margin, y: h - 178, width: w - (margin * 2), height: 28),
        font: NSFont.systemFont(ofSize: 17, weight: .semibold),
        color: NSColor(calibratedRed: 0.145, green: 0.227, blue: 0.388, alpha: 1)
    )

    drawText(
        slide.title,
        in: CGRect(x: margin, y: h - 250, width: w - (margin * 2), height: 58),
        font: NSFont.systemFont(ofSize: 38, weight: .bold),
        color: NSColor(calibratedRed: 0.067, green: 0.094, blue: 0.153, alpha: 1)
    )

    var y = h - 332
    for bullet in slide.bullets.prefix(6) {
        NSColor(calibratedRed: 0.145, green: 0.227, blue: 0.388, alpha: 1).setFill()
        CGRect(x: margin, y: y + 20, width: 12, height: 12).fill()
        drawText(
            bullet,
            in: CGRect(x: margin + 28, y: y, width: w - (margin * 2) - 28, height: 58),
            font: NSFont.systemFont(ofSize: 24, weight: .regular),
            color: NSColor(calibratedRed: 0.12, green: 0.16, blue: 0.24, alpha: 1)
        )
        y -= 72
    }

    NSColor(calibratedRed: 0.87, green: 0.90, blue: 0.94, alpha: 1).setFill()
    CGRect(x: margin, y: 50, width: w - (margin * 2), height: 8).fill()
    NSColor(calibratedRed: 0.145, green: 0.388, blue: 0.922, alpha: 1).setFill()
    CGRect(x: margin, y: 50, width: (w - (margin * 2)) * progress, height: 8).fill()

    drawText(
        "Local-only training artifact. No secret values, no wallet signing, no live trading, no deployment.",
        in: CGRect(x: margin, y: 70, width: w - (margin * 2), height: 28),
        font: NSFont.systemFont(ofSize: 14, weight: .medium),
        color: NSColor(calibratedRed: 0.31, green: 0.36, blue: 0.44, alpha: 1),
        alignment: .center
    )

    NSGraphicsContext.restoreGraphicsState()
}

func makePixelBuffer(
    width: Int,
    height: Int,
    slide: SlideSpec,
    index: Int,
    count: Int,
    progress: CGFloat,
    title: String,
    subtitle: String
) throws -> CVPixelBuffer {
    var pixelBuffer: CVPixelBuffer?
    let attrs: [CFString: Any] = [
        kCVPixelBufferCGImageCompatibilityKey: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey: true
    ]
    let status = CVPixelBufferCreate(
        kCFAllocatorDefault,
        width,
        height,
        kCVPixelFormatType_32BGRA,
        attrs as CFDictionary,
        &pixelBuffer
    )

    guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
        throw RenderError.cannotCreatePixelBuffer
    }

    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

    guard
        let baseAddress = CVPixelBufferGetBaseAddress(buffer),
        let context = CGContext(
            data: baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
        )
    else {
        throw RenderError.cannotCreatePixelBuffer
    }

    drawSlide(
        context: context,
        width: width,
        height: height,
        slide: slide,
        index: index,
        count: count,
        progress: progress,
        title: title,
        subtitle: subtitle
    )

    return buffer
}

func renderSilentVideo(spec: TrainingSpec, slides: [RenderedSlide], outputURL: URL) throws {
    if FileManager.default.fileExists(atPath: outputURL.path) {
        try FileManager.default.removeItem(at: outputURL)
    }

    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mov)
    let settings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: spec.width,
        AVVideoHeightKey: spec.height,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 4_000_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
        ]
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = false

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
        assetWriterInput: input,
        sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: spec.width,
            kCVPixelBufferHeightKey as String: spec.height
        ]
    )

    guard writer.canAdd(input) else {
        throw RenderError.cannotAddVideoInput
    }

    writer.add(input)
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    var frameNumber: Int64 = 0
    let fps = max(1, spec.fps)

    for (index, rendered) in slides.enumerated() {
        let frameCount = max(1, Int(ceil(rendered.duration * Double(fps))))

        for frame in 0..<frameCount {
            while !input.isReadyForMoreMediaData {
                Thread.sleep(forTimeInterval: 0.01)
            }

            let overallProgress = CGFloat(Double(index) / Double(max(1, slides.count - 1)))
            let localProgress = CGFloat(Double(frame) / Double(max(1, frameCount - 1)))
            let progress = min(1, max(0, (overallProgress + (localProgress / CGFloat(max(1, slides.count)))) ))
            let buffer = try makePixelBuffer(
                width: spec.width,
                height: spec.height,
                slide: rendered.spec,
                index: index,
                count: slides.count,
                progress: progress,
                title: spec.title,
                subtitle: spec.subtitle
            )
            let presentationTime = CMTime(value: frameNumber, timescale: CMTimeScale(fps))
            adaptor.append(buffer, withPresentationTime: presentationTime)
            frameNumber += 1
        }
    }

    input.markAsFinished()

    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting {
        semaphore.signal()
    }
    semaphore.wait()
}

func exportVideoWithAudio(spec: TrainingSpec, slides: [RenderedSlide], silentVideoURL: URL, outputURL: URL) throws {
    if FileManager.default.fileExists(atPath: outputURL.path) {
        try FileManager.default.removeItem(at: outputURL)
    }

    let composition = AVMutableComposition()
    let videoAsset = AVURLAsset(url: silentVideoURL)
    guard let sourceVideoTrack = videoAsset.tracks(withMediaType: .video).first else {
        throw RenderError.missingVideoTrack
    }
    guard let compositionVideoTrack = composition.addMutableTrack(
        withMediaType: .video,
        preferredTrackID: kCMPersistentTrackID_Invalid
    ) else {
        throw RenderError.missingVideoTrack
    }

    let totalDuration = CMTime(seconds: slides.reduce(0) { $0 + $1.duration }, preferredTimescale: 600)
    try compositionVideoTrack.insertTimeRange(
        CMTimeRange(start: .zero, duration: totalDuration),
        of: sourceVideoTrack,
        at: .zero
    )
    compositionVideoTrack.preferredTransform = sourceVideoTrack.preferredTransform

    var cursor = CMTime.zero
    for slide in slides {
        let audioAsset = AVURLAsset(url: slide.audioURL)
        guard let audioTrack = audioAsset.tracks(withMediaType: .audio).first else {
            throw RenderError.missingAudioTrack(slide.audioURL.path)
        }
        guard let compositionAudioTrack = composition.addMutableTrack(
            withMediaType: .audio,
            preferredTrackID: kCMPersistentTrackID_Invalid
        ) else {
            throw RenderError.missingAudioTrack(slide.audioURL.path)
        }
        let audioDuration = CMTime(seconds: slide.duration, preferredTimescale: 600)
        try compositionAudioTrack.insertTimeRange(
            CMTimeRange(start: .zero, duration: min(audioAsset.duration, audioDuration)),
            of: audioTrack,
            at: cursor
        )
        cursor = cursor + audioDuration
    }

    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
        throw RenderError.exportFailed("Could not create AVAssetExportSession")
    }

    exporter.outputURL = outputURL
    exporter.outputFileType = .mp4
    exporter.shouldOptimizeForNetworkUse = true

    let semaphore = DispatchSemaphore(value: 0)
    exporter.exportAsynchronously {
        semaphore.signal()
    }
    semaphore.wait()

    if exporter.status != .completed {
        throw RenderError.exportFailed(exporter.error?.localizedDescription ?? "unknown export failure")
    }
}

func timestamp(_ seconds: Double) -> String {
    let total = Int(seconds.rounded(.down))
    let h = total / 3600
    let m = (total % 3600) / 60
    let s = total % 60
    return h > 0
        ? String(format: "%d:%02d:%02d", h, m, s)
        : String(format: "%02d:%02d", m, s)
}

func vttTimestamp(_ seconds: Double) -> String {
    let totalMillis = Int((seconds * 1000).rounded())
    let h = totalMillis / 3_600_000
    let m = (totalMillis % 3_600_000) / 60_000
    let s = (totalMillis % 60_000) / 1000
    let ms = totalMillis % 1000
    return String(format: "%02d:%02d:%02d.%03d", h, m, s, ms)
}

func writeSupportFiles(spec: TrainingSpec, slides: [RenderedSlide], outputURL: URL) throws {
    let baseURL = outputURL.deletingPathExtension()
    let chaptersURL = baseURL.appendingPathExtension("chapters.txt")
    let scriptURL = baseURL.appendingPathExtension("script.md")
    let vttURL = baseURL.appendingPathExtension("vtt")

    var chapters = "\(spec.title)\n\n"
    var script = "# \(spec.title)\n\n\(spec.subtitle)\n\n"
    var vtt = "WEBVTT\n\n"

    for (index, slide) in slides.enumerated() {
        chapters += "\(timestamp(slide.start)) - \(slide.spec.chapter): \(slide.spec.title)\n"
        script += "## \(index + 1). \(slide.spec.chapter): \(slide.spec.title)\n\n"
        for bullet in slide.spec.bullets {
            script += "- \(bullet)\n"
        }
        script += "\nNarration:\n\n\(slide.spec.narration)\n\n"

        let end = slide.start + slide.duration
        vtt += "\(index + 1)\n\(vttTimestamp(slide.start)) --> \(vttTimestamp(end))\n\(slide.spec.chapter): \(slide.spec.title)\n\n"
    }

    try writeText(chapters, to: chaptersURL)
    try writeText(script, to: scriptURL)
    try writeText(vtt, to: vttURL)
}

func render(specPath: String) throws {
    let spec = try loadSpec(from: specPath)
    let workspace = URL(fileURLWithPath: spec.workspacePath)
    try ensureCleanDirectory(workspace)

    let outputURL = URL(fileURLWithPath: spec.outputPath)
    try FileManager.default.createDirectory(
        at: outputURL.deletingLastPathComponent(),
        withIntermediateDirectories: true
    )

    let slides = try generateSlideAudio(spec: spec, workspace: workspace)
    let silentVideoURL = workspace.appendingPathComponent("silent.mov")
    try renderSilentVideo(spec: spec, slides: slides, outputURL: silentVideoURL)
    try exportVideoWithAudio(spec: spec, slides: slides, silentVideoURL: silentVideoURL, outputURL: outputURL)
    try writeSupportFiles(spec: spec, slides: slides, outputURL: outputURL)

    print("Rendered \(outputURL.path)")
}

do {
    guard CommandLine.arguments.count == 2 else {
        throw RenderError.invalidArguments
    }

    try render(specPath: CommandLine.arguments[1])
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
