import { getDatabase } from '../config/database.js';
import bcrypt from 'bcrypt';

/**
 * Generate 100 more test users with sed characters (special characters)
 * 50 will be online, 50 offline
 */
async function generate100MoreUsers() {
  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Names with special characters (Turkish, French, Spanish, German, etc.)
    const firstNames = [
      'Çağlar', 'Ömer', 'Şükrü', 'İsmail', 'Gülay', 'Müge', 'Özlem', 'Zeynep',
      'François', 'José', 'André', 'René', 'Hélène', 'Zoé', 'Léa', 'Chloé',
      'Björn', 'Søren', 'Jürgen', 'Günther', 'Günter', 'Müller', 'Sören', 'Jörg',
      'Álvaro', 'Ángel', 'Andrés', 'José', 'María', 'Sofía', 'Lucía', 'Inés',
      'Łukasz', 'Michał', 'Paweł', 'Jakub', 'Zofia', 'Maja', 'Kaja', 'Ania',
      'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi',
      'Håkan', 'Åsa', 'Göran', 'Börje', 'Märta', 'Åke', 'Gösta', 'Örjan'
    ];

    const lastNames = [
      'Öztürk', 'Şahin', 'Çelik', 'Yılmaz', 'Kılıç', 'Arslan', 'Doğan', 'Çetin',
      'Müller', 'König', 'Möller', 'Schröder', 'Böhm', 'Köhler', 'Jäger', 'Götz',
      'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Fernández', 'Pérez', 'Sánchez',
      'Lefèvre', 'Beauséjour', 'Côté', 'Désrochers', 'Bélanger', 'Gagnon', 'Léveillé', 'Després',
      'Kowalski', 'Nowak', 'Wójcik', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak',
      'Sørensen', 'Jørgensen', 'Møller', 'Åberg', 'Östberg', 'Öberg', 'Åkesson', 'Örtengren'
    ];

    const genders = ['Male', 'Female'];
    const createdUsers = [];
    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('🚀 Generating 100 users with special characters...\n');

    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const randomNum = Math.floor(Math.random() * 10000);
      
      // Create username without special characters for login
      const cleanFirst = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const cleanLast = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const username = `${cleanFirst}${cleanLast}${randomNum}`.replace(/[^a-z0-9]/g, '');
      
      const displayName = `${firstName} ${lastName}`;
      const age = Math.floor(Math.random() * 50) + 18; // 18-67
      const gender = genders[Math.floor(Math.random() * genders.length)];
      
      // First 50 online, next 50 offline
      const status = i < 50 ? 'online' : 'offline';
      const lastSeen = i < 50 ? new Date() : new Date(Date.now() - Math.floor(Math.random() * 3600000)); // Up to 1 hour ago

      const newUser = {
        username: username,
        password: hashedPassword,
        fullName: displayName,
        displayName: displayName,
        email: `${username}@test.com`,
        age: age,
        gender: gender,
        bio: `Test user with special characters: ${displayName}`,
        status: status,
        lastSeen: lastSeen,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await usersCollection.insertOne(newUser);
      createdUsers.push({
        username: username,
        displayName: displayName,
        status: status,
        id: result.insertedId
      });
    }

    // Display created users
    console.log('✅ Successfully created 100 users!\n');
    
    const onlineUsers = createdUsers.slice(0, 50);
    const offlineUsers = createdUsers.slice(50);

    console.log('🟢 ONLINE USERS (50):');
    onlineUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.displayName} (${user.username})`);
    });

    console.log('\n🔴 OFFLINE USERS (50):');
    offlineUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.displayName} (${user.username})`);
    });

    // Get total count
    const totalUsers = await usersCollection.countDocuments({ username: { $ne: 'system' } });
    const onlineCount = await usersCollection.countDocuments({ status: 'online', username: { $ne: 'system' } });
    const offlineCount = await usersCollection.countDocuments({ status: 'offline', username: { $ne: 'system' } });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DATABASE SUMMARY:');
    console.log(`   • Total users in database: ${totalUsers}`);
    console.log(`   • Online users: ${onlineCount}`);
    console.log(`   • Offline users: ${offlineCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n💡 Testing Tips:');
    console.log('   • All new users have special characters (ç, ş, ö, ü, é, à, etc.)');
    console.log('   • Username: cleaned version (e.g., "caglarozturk1234")');
    console.log('   • Password: "password123" for all users');
    console.log('   • Default view: Shows online users (limit 20)');
    console.log('   • Search view: Shows all matching users (limit 50)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating users:', error);
    process.exit(1);
  }
}

// Run the script
import('../config/database.js').then(({ connectToDatabase }) => {
  connectToDatabase().then(() => {
    generate100MoreUsers();
  });
});
