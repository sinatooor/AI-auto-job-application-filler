export const xpaths = {
    // Lever generally uses standard structure.
    // Enclosing div usually has 'application-question' or 'custom-question' class
    // or simple div wrapping label and input

    // Base field container
    FIELD_CONTAINER: "//*[contains(@class, 'application-question') or contains(@class, 'custom-question')]",

    // Specific input types (relative to container)
    TEXT_INPUT: ".//input[@type='text']",
    TEXTAREA: ".//textarea",
    FILE_INPUT: ".//input[@type='file']",
}
