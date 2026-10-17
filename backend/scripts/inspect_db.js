import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const usersCount = await mongoose.connection.collection('users').countDocuments();
  const studentsCount = await mongoose.connection.collection('students').countDocuments();
  const teachersCount = await mongoose.connection.collection('teachers').countDocuments();

  console.log('Users collection count:', usersCount);
  console.log('Students collection count:', studentsCount);
  console.log('Teachers collection count:', teachersCount);

  const usersByRole = await mongoose.connection.collection('users').aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Users by role:', JSON.stringify(usersByRole, null, 2));

  const sampleStudent = await mongoose.connection.collection('students').findOne();
  console.log('Sample student:', {
    _id: sampleStudent?._id,
    name: sampleStudent?.name,
    enrollmentNo: sampleStudent?.enrollmentNo,
    email: sampleStudent?.email,
    user: sampleStudent?.user
  });

  const sampleTeacher = await mongoose.connection.collection('teachers').findOne();
  console.log('Sample teacher:', {
    _id: sampleTeacher?._id,
    name: sampleTeacher?.name,
    email: sampleTeacher?.email,
    user: sampleTeacher?.user
  });

  // Check how many students have a user account
  const studentsWithUser = await mongoose.connection.collection('students').countDocuments({ user: { $exists: true, $ne: null } });
  console.log('Students with user account linked:', studentsWithUser);

  // Check how many teachers have a user account
  const teachersWithUser = await mongoose.connection.collection('teachers').countDocuments({ user: { $exists: true, $ne: null } });
  console.log('Teachers with user account linked:', teachersWithUser);

  await mongoose.disconnect();
}

run().catch(console.error);
