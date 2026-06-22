package com.subastas.api.common;

/**
 * Codigos de error del TP (tabla de endpoints). Centralizados para evitar typos.
 */
public final class ErrorCodes {
    private ErrorCodes() {}

    // transversales
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
    public static final String INVALID_DATA = "INVALID_DATA";
    public static final String INVALID_FILTER = "INVALID_FILTER";
    public static final String PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE";
    public static final String INTERNAL_ERROR = "INTERNAL_ERROR";

    // auth
    public static final String EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED";
    public static final String DOCUMENT_ALREADY_REGISTERED = "DOCUMENT_ALREADY_REGISTERED";
    public static final String INVALID_COUNTRY = "INVALID_COUNTRY";
    public static final String TOKEN_INVALID = "TOKEN_INVALID";
    public static final String TOKEN_EXPIRED = "TOKEN_EXPIRED";
    public static final String ALREADY_COMPLETED = "ALREADY_COMPLETED";
    public static final String WEAK_PASSWORD = "WEAK_PASSWORD";
    public static final String PASSWORD_MISMATCH = "PASSWORD_MISMATCH";
    public static final String CODE_INVALID = "CODE_INVALID";
    public static final String CODE_EXPIRED = "CODE_EXPIRED";
    public static final String INVALID_CREDENTIALS = "INVALID_CREDENTIALS";
    public static final String ACCOUNT_PENDING_VERIFICATION = "ACCOUNT_PENDING_VERIFICATION";
    public static final String ACCOUNT_REGISTRATION_INCOMPLETE = "ACCOUNT_REGISTRATION_INCOMPLETE";
    public static final String ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED";
    public static final String REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID";

    // subastas
    public static final String SUBASTA_NOT_FOUND = "SUBASTA_NOT_FOUND";
    public static final String INVALID_DATE = "INVALID_DATE";
    public static final String INVALID_CATEGORY = "INVALID_CATEGORY";
    public static final String SUBASTA_ALREADY_CLOSED = "SUBASTA_ALREADY_CLOSED";
    public static final String SUBASTA_CERRADA = "SUBASTA_CERRADA";
    public static final String SUBASTA_NOT_STARTED = "SUBASTA_NOT_STARTED";
    public static final String ITEM_NOT_ACTIVE = "ITEM_NOT_ACTIVE";
    public static final String CATALOGO_NOT_FOUND = "CATALOGO_NOT_FOUND";
    public static final String ITEM_NOT_FOUND = "ITEM_NOT_FOUND";
    public static final String ITEM_NOT_IN_SUBASTA = "ITEM_NOT_IN_SUBASTA";
    public static final String NOT_PART_OF_SUBASTA = "NOT_PART_OF_SUBASTA";
    public static final String ALREADY_JOINED = "ALREADY_JOINED";
    public static final String ALREADY_IN_ANOTHER_AUCTION = "ALREADY_IN_ANOTHER_AUCTION";
    public static final String NOT_ALLOWED = "NOT_ALLOWED";

    // pujas
    public static final String INVALID_AMOUNT = "INVALID_AMOUNT";
    public static final String PUJA_TOO_LOW = "PUJA_TOO_LOW";
    public static final String PUJA_TOO_HIGH = "PUJA_TOO_HIGH";
    public static final String ALREADY_HIGHEST_BIDDER = "ALREADY_HIGHEST_BIDDER";
    public static final String ITEM_ALREADY_SOLD = "ITEM_ALREADY_SOLD";
    public static final String NO_VERIFIED_PAYMENT_METHOD = "NO_VERIFIED_PAYMENT_METHOD";
    public static final String GARANTIA_EXCEDIDA = "GARANTIA_EXCEDIDA";
    public static final String PUJA_NOT_FOUND = "PUJA_NOT_FOUND";
    public static final String NOT_OWNER_OF_PUJA = "NOT_OWNER_OF_PUJA";
    public static final String NOT_CLIENT = "NOT_CLIENT";

    // clientes / productos / pagos
    public static final String CLIENTE_NOT_FOUND = "CLIENTE_NOT_FOUND";
    public static final String PRODUCTO_NOT_FOUND = "PRODUCTO_NOT_FOUND";
    public static final String NOT_OWNER_OF_PRODUCTO = "NOT_OWNER_OF_PRODUCTO";
    public static final String PAYMENT_METHOD_NOT_FOUND = "PAYMENT_METHOD_NOT_FOUND";
    public static final String PAYMENT_METHOD_IN_USE = "PAYMENT_METHOD_IN_USE";
    public static final String NOT_OWNER = "NOT_OWNER";
    public static final String PAIS_NOT_FOUND = "PAIS_NOT_FOUND";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String CONFLICT = "CONFLICT";

    // ofrecer un bien (alta de producto)
    public static final String TERMS_NOT_ACCEPTED = "TERMS_NOT_ACCEPTED";
    public static final String ORIGIN_NOT_DECLARED = "ORIGIN_NOT_DECLARED";
    public static final String NO_PHOTOS = "NO_PHOTOS";
    public static final String INVALID_IMAGE = "INVALID_IMAGE";

    // adquisiciones / entrega / pagos (area 1)
    public static final String ADQUISICION_NOT_FOUND = "ADQUISICION_NOT_FOUND";
    public static final String ADQUISICION_ALREADY_PAID = "ADQUISICION_ALREADY_PAID";
    public static final String FACTURA_NOT_FOUND = "FACTURA_NOT_FOUND";
    public static final String PAYMENT_METHOD_NOT_VERIFIED = "PAYMENT_METHOD_NOT_VERIFIED";
    public static final String ENTREGA_ALREADY_DEFINED = "ENTREGA_ALREADY_DEFINED";
    public static final String ENTREGA_NOT_FOUND = "ENTREGA_NOT_FOUND";
    public static final String ENTREGA_NOT_GENERATED = "ENTREGA_NOT_GENERATED";
    public static final String DELIVERY_TYPE_MISMATCH = "DELIVERY_TYPE_MISMATCH";
    public static final String DELIVERY_NOT_CONFIRMABLE = "DELIVERY_NOT_CONFIRMABLE";
    public static final String MULTA_NOT_FOUND = "MULTA_NOT_FOUND";
    public static final String MULTA_ALREADY_PAID = "MULTA_ALREADY_PAID";
}
