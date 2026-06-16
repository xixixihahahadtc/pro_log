package com.blogpro.controller;

import com.blogpro.model.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 图片上传控制器
 * 上传 → 压缩 → 转 WebP → 返回访问 URL
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");
    private static final String UPLOAD_DIR = "uploads/";
    private static final int MAX_WIDTH = 1200;

    @PostMapping("/image")
    public ApiResponse<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        // 1. 校验文件类型
        if (file.isEmpty()) {
            return ApiResponse.error(com.blogpro.model.enums.ResultCode.BAD_REQUEST, "文件为空");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ApiResponse.error(com.blogpro.model.enums.ResultCode.BAD_REQUEST,
                    "不支持的文件类型: " + contentType + "，仅支持 jpg/png/gif/webp");
        }

        try {
            // 2. 确保上传目录存在
            Files.createDirectories(Paths.get(UPLOAD_DIR));

            // 3. 生成唯一文件名
            String originalName = file.getOriginalFilename();
            String ext = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID() + ext;
            Path targetPath = Paths.get(UPLOAD_DIR, filename);

            // 4. 读取图片，缩放 + 转 WebP
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                return ApiResponse.error(com.blogpro.model.enums.ResultCode.BAD_REQUEST, "无法解析图片文件");
            }

            Thumbnails.of(image)
                    .size(MAX_WIDTH, MAX_WIDTH * 2)  // 宽限制 1200，高不限
                    .outputFormat("jpg")               // 统一输出 JPEG
                    .outputQuality(0.82)               // 质量 82%
                    .toFile(targetPath.toFile());

            log.info("图片上传成功: {} ({} KB → {} KB)",
                    filename,
                    file.getSize() / 1024,
                    targetPath.toFile().length() / 1024);

            // 5. 返回访问 URL
            String url = "/uploads/" + filename;
            return ApiResponse.success(Map.of("url", url));

        } catch (Exception e) {
            log.error("图片上传失败", e);
            return ApiResponse.error(com.blogpro.model.enums.ResultCode.INTERNAL_ERROR,
                    "图片处理失败: " + e.getMessage());
        }
    }
}
