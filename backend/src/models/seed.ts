import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import User, { IUser } from './user.model';
import Patient, { IPatient } from './patient.model';
import Doctor, { IDoctor } from './doctor.model';
import Appointment from './appointment.model';
import DocumentModel from './document.model';
import MedicalRecord from './medical.record.model';
import Message from './message.model';
import Prescription from './prescription.model';
import Recommendation from './recommendation.model';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { uploadToS3 } from '../services/aws.s3.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

mongoose.set('strictQuery', true);

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/careLog');
    console.log('Conectat la baza de date');

    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await DocumentModel.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Message.deleteMany({});
    await Prescription.deleteMany({});
    await Recommendation.deleteMany({});
    await User.deleteMany({ role: { $ne: 'User' } });
    console.log('Colecțiile existente au fost golite.');

    const patientUsersData: Partial<IUser>[] = [];
    const patientProfilesData: Partial<IPatient>[] = [];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const username = faker.internet.userName({ firstName, lastName }) + faker.number.int({ min: 100, max: 999 }).toString();
      const email = faker.internet.email({ firstName, lastName });
      const hashedPassword = await bcrypt.hash("admin123", 10);
      patientUsersData.push({
        username,
        email,
        password: hashedPassword,
        role: 'Patient',
        createdAt: new Date(),
        isConfirmed: true
      });
      const phone = '07' + faker.string.numeric(8);
      const gender = faker.helpers.arrayElement(['Male', 'Female']);
      const birthDate = faker.date.birthdate({ min: 18, max: 90, mode: 'age' });
      const address = faker.address.streetAddress() + ', ' + faker.address.city();
      const nationalId = faker.number.int({ min: 1000000000000, max: 9999999999999 }).toString();
      const medicalHistory = faker.lorem.sentence();
      const allergies = faker.datatype.boolean()
        ? faker.helpers.arrayElements(['praf', 'polen', 'penicilină', 'lactoză', 'gluten', 'arahide'], faker.number.int({ min: 1, max: 3 })).join(', ')
        : 'Niciuna';
      patientProfilesData.push({
        firstName,
        lastName,
        phone,
        birthDate,
        gender,
        address,
        nationalId,
        medicalHistory,
        allergies
      });
    }
    const createdPatientUsers = await User.insertMany(patientUsersData);
    createdPatientUsers.forEach((user, index) => {
      patientProfilesData[index].userAccountId = user._id;
    });
    const createdPatients = await Patient.insertMany(patientProfilesData);
    console.log(`Au fost create ${createdPatients.length} profiluri de pacienți și conturile lor de utilizator.`);

    const doctorUsersData: Partial<IUser>[] = [];
    const doctorProfilesData: Partial<IDoctor>[] = [];
    const specializations = ['Cardiologie', 'Dermatologie', 'Pediatrie', 'Neurologie', 'Oncologie', 'Medicină internă', 'Psihiatrie'];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const username = faker.internet.userName({ firstName, lastName }) + faker.number.int({ min: 100, max: 999 }).toString();
      const email = faker.internet.email({ firstName, lastName });
      const hashedPassword = await bcrypt.hash("admin123", 10);
      doctorUsersData.push({
        username,
        email,
        password: hashedPassword,
        role: 'Doctor',
        createdAt: new Date(),
        isConfirmed: true
      });
      const phone = '07' + faker.string.numeric(8);
      const specialization = faker.helpers.arrayElement(specializations);
      
      const availableSlots: string[] = [];
      const startHour = faker.number.int({ min: 8, max: 13 });
      const durationHours = faker.number.int({ min: 4, max: 6 });
      for (let h = startHour; h < startHour + durationHours; h++) {
        for (let m = 0; m < 60; m += 30) {
          availableSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      }

      doctorProfilesData.push({
        firstName,
        lastName,
        phone,
        specialization,
        isVerified: true,
        availableSlots
      });
    }
    const createdDoctorUsers = await User.insertMany(doctorUsersData);
    createdDoctorUsers.forEach((user, index) => {
      doctorProfilesData[index].userAccountId = user._id;
    });
    const createdDoctors = await Doctor.insertMany(doctorProfilesData);
    console.log(`Au fost create ${createdDoctors.length} profiluri de doctori și conturile lor de utilizator.`);

    const appointmentsData = [];
    for (let i = 0; i < 20; i++) {
      const patient = faker.helpers.arrayElement(createdPatients);
      const doctor = faker.helpers.arrayElement(createdDoctors);
      
      let appointmentDate = faker.date.between({ from: new Date('2026-06-06'), to: new Date('2026-12-12') });
      appointmentDate.setHours(0, 0, 0, 0);
      while (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6) {
        appointmentDate = faker.date.between({ from: new Date('2026-06-06'), to: new Date('2026-12-12') });
        appointmentDate.setHours(0, 0, 0, 0);
      }

      const time = faker.helpers.arrayElement(doctor.availableSlots || ['08:00']);
      
      const notes = faker.lorem.sentence();
      appointmentsData.push({
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate,
        time,
        status: "Scheduled",
        notes
      });
    }
    const createdAppointments = await Appointment.insertMany(appointmentsData);
    console.log(`Au fost create ${createdAppointments.length} programări.`);

    const documentsData = [];
    const documentTypes = ['Analiză sânge', 'Radiografie', 'Ecografie', 'RMN', 'CT', 'Electrocardiogramă', 'Test COVID'];
    const testFilePath = path.resolve(__dirname, '../test_document.webp');
    const testFileBuffer = fs.readFileSync(testFilePath);
    console.log(`Fișier test (${testFileBuffer.length} bytes) citit din: ${testFilePath}`);

    for (const patient of createdPatients) {
      const documentType = faker.helpers.arrayElement(documentTypes);
      const originalName = `${documentType.replace(/\s+/g, '_')}_${faker.string.alphanumeric(6)}.webp`;

      // Upload efectiv pe S3
      const documentPath = await uploadToS3(testFileBuffer, 'image/webp', originalName);
      console.log(`  → Încărcat pe S3: ${documentPath}`);

      const uploadedAt = faker.date.past();
      documentsData.push({
        patientId: patient._id,
        documentType,
        documentPath,
        originalName,
        storageType: 's3',
        uploadedAt
      });
    }
    const createdDocuments = await DocumentModel.insertMany(documentsData);
    console.log(`Au fost create ${createdDocuments.length} documente medicale cu fișiere reale pe S3.`);

    const medicalRecordsData = [];
    for (const patient of createdPatients) {
      const doctor = faker.helpers.arrayElement(createdDoctors);
      const recordDate = faker.date.recent();
      const diagnosis = faker.lorem.sentence();
      const observations = faker.lorem.sentences(2);
      const recommendedTreatment = faker.lorem.sentence();
      medicalRecordsData.push({
        patientId: patient._id,
        doctorId: doctor._id,
        recordDate,
        diagnosis,
        observations,
        recommendedTreatment
      });
    }
    const createdMedicalRecords = await MedicalRecord.insertMany(medicalRecordsData);
    console.log(`Au fost create ${createdMedicalRecords.length} înregistrări MedicalRecord.`);

    const prescriptionsData = [];
    for (const record of createdMedicalRecords) {
      const medications = faker.lorem.words(3);
      const dosage = `${faker.number.int({ min: 100, max: 999 })} mg, ${faker.number.int({ min: 1, max: 3 })} ori pe zi`;
      const observations = faker.lorem.sentence();
      prescriptionsData.push({
        medicalRecordId: record._id,
        medications,
        dosage,
        observations
      });
    }
    const createdPrescriptions = await Prescription.insertMany(prescriptionsData);
    console.log(`Au fost create ${createdPrescriptions.length} prescripții.`);

    const recommendationsData = [];
    for (const patient of createdPatients) {
      const doctor = faker.helpers.arrayElement(createdDoctors);
      const content = faker.lorem.sentence();
      const issuedDate = faker.date.recent();
      recommendationsData.push({
        patientId: patient._id,
        doctorId: doctor._id,
        content,
        issuedDate
      });
    }
    const createdRecommendations = await Recommendation.insertMany(recommendationsData);
    console.log(`Au fost create ${createdRecommendations.length} recomandări.`);

    const messagesData = [];
    const allUsers = [...createdPatientUsers, ...createdDoctorUsers];
    for (let i = 0; i < 10; i++) {
      const sender = faker.helpers.arrayElement(allUsers);
      let receiver = faker.helpers.arrayElement(allUsers);
      while (receiver._id.equals(sender._id)) {
        receiver = faker.helpers.arrayElement(allUsers);
      }
      const content = faker.lorem.sentence();
      const sentAt = faker.date.recent();
      messagesData.push({
        senderId: sender._id,
        receiverId: receiver._id,
        content,
        sentAt
      });
    }
    const createdMessages = await Message.insertMany(messagesData);
    console.log(`Au fost create ${createdMessages.length} mesaje.`);

    console.log('Popularea bazei de date a fost realizată cu succes.');
  } catch (error) {
    console.error('Eroare în timpul populării bazei de date:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Deconectat de la baza de date.');
  }
})();
