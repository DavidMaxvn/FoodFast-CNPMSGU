package com.fastfood.management.controller;

import com.fastfood.management.service.ImageStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*")
public class FileController {
    private static final Logger log = LoggerFactory.getLogger(FileController.class);
    
    private final ImageStorage storage;

    public FileController(ImageStorage storage) {
        this.storage = storage;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestPart("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
            }

            // Validate file type (basic image validation)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only image files are allowed"));
            }

            // Store file and get relative path
            String relPath = storage.store(file, "products");
            
            log.info("File uploaded successfully: {}", relPath);
            return ResponseEntity.ok(Map.of("path", relPath));
            
        } catch (IOException e) {
            log.error("File upload failed", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "File upload failed: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/upload/{folder}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadToFolder(
            @PathVariable String folder,
            @RequestPart("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only image files are allowed"));
            }

            // Store file in specified folder
            String relPath = storage.store(file, folder);
            
            log.info("File uploaded to folder '{}': {}", folder, relPath);
            return ResponseEntity.ok(Map.of("path", relPath));
            
        } catch (IOException e) {
            log.error("File upload to folder '{}' failed", folder, e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "File upload failed: " + e.getMessage()));
        }
    }
}