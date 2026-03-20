import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
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

mongoose.set('strictQuery', true);

(async () => {
  try {
    await mongoose.connect('mongodb+srv://Cozma-Andrei:TwIxIf4sPiMagvYK@cluster0.3rt2eof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/carelog');
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
      doctorProfilesData.push({
        firstName,
        lastName,
        phone,
        specialization,
        isVerified: true
      });
    }
    const createdDoctorUsers = await User.insertMany(doctorUsersData);
    createdDoctorUsers.forEach((user, index) => {
      doctorProfilesData[index].userAccountId = user._id;
    });
    const createdDoctors = await Doctor.insertMany(doctorProfilesData);
    console.log(`Au fost create ${createdDoctors.length} profiluri de doctori și conturile lor de utilizator.`);

    const appointmentsData = [];
    const statusOptions = ['Scheduled', 'Completed', 'Cancelled', 'Pending', 'Confirmed'];
    for (let i = 0; i < 10; i++) {
      const patient = faker.helpers.arrayElement(createdPatients);
      const doctor = faker.helpers.arrayElement(createdDoctors);
      const appointmentDate = faker.date.between({ from: new Date('2025-06-06'), to: new Date('2025-12-12') });
      const hour = faker.number.int({ min: 8, max: 17 });
      const minute = faker.number.int({ min: 0, max: 59 });
      const time = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
      const status = faker.helpers.arrayElement(statusOptions);
      const notes = faker.lorem.sentence();
      appointmentsData.push({
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate,
        time,
        status,
        notes
      });
    }
    const createdAppointments = await Appointment.insertMany(appointmentsData);
    console.log(`Au fost create ${createdAppointments.length} programări.`);

    const documentsData = [];
    for (const patient of createdPatients) {
      const documentType = faker.lorem.word();
      const fileName = faker.system.fileName();
      const documentPath = `/uploads/documents/${fileName}`;
      const uploadedAt = faker.date.past();
      documentsData.push({
        patientId: patient._id,
        documentType,
        documentPath,
        uploadedAt
      });
    }
    const createdDocuments = await DocumentModel.insertMany(documentsData);
    console.log(`Au fost create ${createdDocuments.length} documente medicale (Document).`);

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
