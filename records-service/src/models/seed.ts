import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import bcrypt from 'bcrypt';
import Patient from './patient.model';
import Doctor from './doctor.model';
import Appointment from './appointment.model';
import DocumentModel from './document.model';
import MedicalRecord from './medical.record.model';
import Message from './message.model';
import Prescription from './prescription.model';
import Recommendation from './recommendation.model';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const IO_SERVICE_URL = process.env.IO_SERVICE_URL || 'http://localhost:5004';

mongoose.set('strictQuery', true);

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/careLog_medical';
    await mongoose.connect(mongoUri);
    console.log('Conectat la Medical DB');

    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await DocumentModel.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Message.deleteMany({});
    await Prescription.deleteMany({});
    await Recommendation.deleteMany({});
    console.log('Colecțiile existente au fost golite.');

    // Create user accounts directly in Auth DB (we need a separate connection for this)
    const authMongoUri = process.env.AUTH_MONGO_URI || 'mongodb://localhost:27017/careLog_auth';
    const authConn = await mongoose.createConnection(authMongoUri);
    const UserSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      isConfirmed: { type: Boolean, required: true, default: false },
    }, { timestamps: false });
    const User = authConn.model('User', UserSchema);
    await User.deleteMany({ role: { $ne: 'User' } });
    console.log('Users existenți (non-User) au fost goliti din Auth DB.');

    const patientUsersData: any[] = [];
    const patientProfilesData: any[] = [];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const username = faker.internet.userName({ firstName, lastName }) + faker.number.int({ min: 100, max: 999 }).toString();
      const email = faker.internet.email({ firstName, lastName });
      const hashedPassword = await bcrypt.hash("admin123", 10);
      patientUsersData.push({
        username, email, password: hashedPassword, role: 'Patient', createdAt: new Date(), isConfirmed: true
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
        firstName, lastName, phone, birthDate, gender, address, nationalId, medicalHistory, allergies
      });
    }
    const createdPatientUsers = await User.insertMany(patientUsersData);
    createdPatientUsers.forEach((user: any, index: number) => {
      patientProfilesData[index].userAccountId = user._id;
    });
    const createdPatients = await Patient.insertMany(patientProfilesData);
    console.log(`Au fost create ${createdPatients.length} profiluri de pacienți.`);

    const doctorUsersData: any[] = [];
    const doctorProfilesData: any[] = [];
    const specializations = ['Cardiologie', 'Dermatologie', 'Pediatrie', 'Neurologie', 'Oncologie', 'Medicină internă', 'Psihiatrie'];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const username = faker.internet.userName({ firstName, lastName }) + faker.number.int({ min: 100, max: 999 }).toString();
      const email = faker.internet.email({ firstName, lastName });
      const hashedPassword = await bcrypt.hash("admin123", 10);
      doctorUsersData.push({
        username, email, password: hashedPassword, role: 'Doctor', createdAt: new Date(), isConfirmed: true
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
        firstName, lastName, phone, specialization, isVerified: true, availableSlots
      });
    }
    const createdDoctorUsers = await User.insertMany(doctorUsersData);
    createdDoctorUsers.forEach((user: any, index: number) => {
      doctorProfilesData[index].userAccountId = user._id;
    });
    const createdDoctors = await Doctor.insertMany(doctorProfilesData);
    console.log(`Au fost create ${createdDoctors.length} profiluri de doctori.`);

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
      appointmentsData.push({ patientId: patient._id, doctorId: doctor._id, appointmentDate, time, status: "Scheduled", notes });
    }
    const createdAppointments = await Appointment.insertMany(appointmentsData);
    console.log(`Au fost create ${createdAppointments.length} programări.`);

    // Documents - upload to IO Service if available, otherwise skip S3
    const documentsData = [];
    const documentTypes = ['Analiză sânge', 'Radiografie', 'Ecografie', 'RMN', 'CT', 'Electrocardiogramă', 'Test COVID'];
    const testFilePath = path.resolve(__dirname, '../test_document.webp');
    
    let testFileBuffer: Buffer | null = null;
    try {
      testFileBuffer = fs.readFileSync(testFilePath);
      console.log(`Fișier test (${testFileBuffer.length} bytes) citit din: ${testFilePath}`);
    } catch (e) {
      console.warn('Test document nu a fost găsit, documentele vor fi create fără fișier S3.');
    }

    for (const patient of createdPatients) {
      const documentType = faker.helpers.arrayElement(documentTypes);
      const originalName = `${documentType.replace(/\s+/g, '_')}_${faker.string.alphanumeric(6)}.webp`;
      let documentPath = `documents/seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (testFileBuffer) {
        try {
          const FormData = require('form-data');
          const formData = new FormData();
          formData.append('file', testFileBuffer, { filename: originalName, contentType: 'image/webp' });
          const ioResp = await axios.post(`${IO_SERVICE_URL}/upload`, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          });
          documentPath = ioResp.data.fileKey;
          console.log(`  → Încărcat pe S3 via IO Service: ${documentPath}`);
        } catch (e: any) {
          console.warn(`  → Nu s-a putut încărca pe IO Service: ${e.message}. Se folosește path local.`);
        }
      }

      documentsData.push({
        patientId: patient._id, documentType, documentPath, originalName, storageType: 's3', uploadedAt: faker.date.past()
      });
    }
    const createdDocuments = await DocumentModel.insertMany(documentsData);
    console.log(`Au fost create ${createdDocuments.length} documente medicale.`);

    const medicalRecordsData = [];
    for (const patient of createdPatients) {
      const doctor = faker.helpers.arrayElement(createdDoctors);
      medicalRecordsData.push({
        patientId: patient._id, doctorId: doctor._id, recordDate: faker.date.recent(),
        diagnosis: faker.lorem.sentence(), observations: faker.lorem.sentences(2), recommendedTreatment: faker.lorem.sentence()
      });
    }
    const createdMedicalRecords = await MedicalRecord.insertMany(medicalRecordsData);
    console.log(`Au fost create ${createdMedicalRecords.length} înregistrări MedicalRecord.`);

    const prescriptionsData = [];
    for (const record of createdMedicalRecords) {
      prescriptionsData.push({
        medicalRecordId: record._id,
        medications: faker.lorem.words(3),
        dosage: `${faker.number.int({ min: 100, max: 999 })} mg, ${faker.number.int({ min: 1, max: 3 })} ori pe zi`,
        observations: faker.lorem.sentence()
      });
    }
    const createdPrescriptions = await Prescription.insertMany(prescriptionsData);
    console.log(`Au fost create ${createdPrescriptions.length} prescripții.`);

    const recommendationsData = [];
    for (const patient of createdPatients) {
      const doctor = faker.helpers.arrayElement(createdDoctors);
      recommendationsData.push({
        patientId: patient._id, doctorId: doctor._id, content: faker.lorem.sentence(), issuedDate: faker.date.recent()
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
      messagesData.push({
        senderId: sender._id, receiverId: receiver._id, content: faker.lorem.sentence(), sentAt: faker.date.recent()
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
