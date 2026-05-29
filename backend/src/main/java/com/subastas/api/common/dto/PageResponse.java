package com.subastas.api.common.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Respuesta paginada con la forma usada en la tabla de endpoints:
 * { page, pageSize, total, totalPages, data: [...] }
 */
public record PageResponse<T>(
        int page,
        int pageSize,
        long total,
        int totalPages,
        List<T> data
) {
    public static <T> PageResponse<T> from(Page<T> p) {
        return new PageResponse<>(
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.getContent()
        );
    }
}
