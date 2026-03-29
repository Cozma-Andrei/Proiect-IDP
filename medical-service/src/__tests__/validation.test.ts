import Joi from 'joi';

describe('Medical Service Validation Logic', () => {
  const appointmentSchema = Joi.object({
    doctorId: Joi.string().required(),
    appointmentDate: Joi.date().min('now').required(),
    time: Joi.string().required(),
    notes: Joi.string().required(),
  }).unknown(true);

  it('should validate a correct appointment object', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    const validData = {
      doctorId: '507f1f77bcf86cd799439011',
      appointmentDate: futureDate.toISOString(),
      time: '10:00',
      notes: 'Consultatie de rutina',
    };
    const { error } = appointmentSchema.validate(validData);
    expect(error).toBeUndefined();
  });

  it('should fail if doctorId is missing', () => {
    const invalidData = {
      appointmentDate: new Date().toISOString(),
      time: '10:00',
      notes: 'Consultatie',
    };
    const { error } = appointmentSchema.validate(invalidData);
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('doctorId');
  });

  it('should fail if date is in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const invalidData = {
      doctorId: '507f1f77bcf86cd799439011',
      appointmentDate: pastDate.toISOString(),
      time: '10:00',
      notes: 'Consultatie',
    };
    const { error } = appointmentSchema.validate(invalidData);
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('appointmentDate');
  });
});
