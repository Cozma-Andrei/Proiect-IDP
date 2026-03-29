import Joi from 'joi';

describe('Auth Service Validation Logic', () => {
  const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }).unknown(true);

  it('should validate a correct registration object', () => {
    const validData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const { error } = registerSchema.validate(validData);
    expect(error).toBeUndefined();
  });

  it('should fail if email is invalid', () => {
    const invalidData = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123',
    };
    const { error } = registerSchema.validate(invalidData);
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('email');
  });

  it('should fail if password is too short', () => {
    const invalidData = {
      username: 'testuser',
      email: 'test@example.com',
      password: '123',
    };
    const { error } = registerSchema.validate(invalidData);
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('password');
  });
});
