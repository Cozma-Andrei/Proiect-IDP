import Joi from 'joi';

describe('IO Service Validation Logic', () => {
  const fileUploadSchema = Joi.object({
    fileType: Joi.string().valid('image/jpeg', 'image/png', 'application/pdf').required(),
    fileSize: Joi.number().max(10 * 1024 * 1024).required(), // 10MB
  }).unknown(true);

  it('should validate a correct file upload object', () => {
    const validData = {
      fileType: 'image/jpeg',
      fileSize: 5 * 1024 * 1024,
    };
    const { error } = fileUploadSchema.validate(validData);
    expect(error).toBeUndefined();
  });

  it('should fail if fileType is not supported', () => {
    const invalidData = {
      fileType: 'text/plain',
      fileSize: 1024,
    };
    const { error } = fileUploadSchema.validate(invalidData);
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('fileType');
  });

  it('should fail if fileSize is too large', () => {
    const invalidData = {
      fileType: 'image/png',
      fileSize: 20 * 1024 * 1024,
    };
    const { error } = fileUploadSchema.validate(invalidData);
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('fileSize');
  });
});
