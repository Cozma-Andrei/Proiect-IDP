import Joi from 'joi';

describe('Records Service Validation Logic', () => {
  const patientSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    nationalId: Joi.string().length(13).required(),
  }).unknown(true);

  it('should validate a correct patient object', () => {
    const validData = {
      firstName: 'Ion',
      lastName: 'Popescu',
      email: 'ion.popescu@example.com',
      nationalId: '1234567890123',
    };
    const { error } = patientSchema.validate(validData);
    expect(error).toBeUndefined();
  });

  it('should fail if nationalId is not 13 characters', () => {
    const invalidData = {
      firstName: 'Ion',
      lastName: 'Popescu',
      email: 'ion.popescu@example.com',
      nationalId: '123',
    };
    const { error } = patientSchema.validate(invalidData);
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('nationalId');
  });
});
