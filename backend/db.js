const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper functions to wrap sqlite3 methods in Promises
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize the database tables
const initDb = async () => {
  try {
    // Enable Foreign Keys
    await dbRun('PRAGMA foreign_keys = ON;');

    // 1. Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'seller', 'foster_parent', 'buyer')) DEFAULT 'buyer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Pets table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pets (
        pet_id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        pet_name TEXT NOT NULL,
        species TEXT NOT NULL,
        breed TEXT,
        age INTEGER,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Unknown')) DEFAULT 'Unknown',
        health_info TEXT,
        FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // 3. Pet Images table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pet_images (
        image_id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER,
        image_url TEXT NOT NULL,
        FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE
      )
    `);

    // 4. Pet Listings table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pet_listings (
        listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER,
        listing_type TEXT CHECK(listing_type IN ('sell', 'adopt', 'foster')) NOT NULL,
        price REAL DEFAULT 0,
        status TEXT CHECK(status IN ('active', 'pending', 'completed')) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE
      )
    `);

    // 5. Adoption Applications table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS adoption_applications (
        application_id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER,
        applicant_id INTEGER,
        message TEXT,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES pet_listings(listing_id) ON DELETE CASCADE,
        FOREIGN KEY (applicant_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // 6. Foster Requests table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS foster_requests (
        request_id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER,
        foster_parent_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES pet_listings(listing_id) ON DELETE CASCADE,
        FOREIGN KEY (foster_parent_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // 7. Payments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        payment_status TEXT CHECK(payment_status IN ('pending', 'success', 'failed')) DEFAULT 'success',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // 8. Reviews table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reviewer_id INTEGER,
        reviewed_user_id INTEGER,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // 9. Messages table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        receiver_id INTEGER,
        message_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // 10. Notifications table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        is_read INTEGER CHECK(is_read IN (0, 1)) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables verified/created successfully.');
    await seedData();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Seed dummy data
const seedData = async () => {
  try {
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
      console.log('Database already contains data. Skipping seeding.');
      return;
    }

    console.log('Seeding initial data...');
    const hashedPw = await bcrypt.hash('password123', 10);

    // Seed Users
    const users = [
      { name: 'Alice Smith', email: 'alice@petpal.com', phone: '123-456-7890', password_hash: hashedPw, role: 'seller' },
      { name: 'Bob Johnson', email: 'bob@petpal.com', phone: '234-567-8901', password_hash: hashedPw, role: 'foster_parent' },
      { name: 'Charlie Brown', email: 'charlie@petpal.com', phone: '345-678-9012', password_hash: hashedPw, role: 'buyer' },
      { name: 'Diana Prince', email: 'diana@petpal.com', phone: '456-789-0123', password_hash: hashedPw, role: 'admin' },
      { name: 'Emily Davis', email: 'emily@petpal.com', phone: '567-890-1234', password_hash: hashedPw, role: 'seller' }
    ];

    const seededUsers = [];
    for (const u of users) {
      const res = await dbRun(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.email, u.phone, u.password_hash, u.role]
      );
      seededUsers.push({ id: res.id, ...u });
    }

    // Seed Pets
    const pets = [
      { owner_id: seededUsers[0].id, name: 'Max', species: 'Dog', breed: 'Golden Retriever', age: 2, gender: 'Male', health_info: 'Fully vaccinated, microchipped, friendly with kids' },
      { owner_id: seededUsers[0].id, name: 'Bella', species: 'Dog', breed: 'French Bulldog', age: 1, gender: 'Female', health_info: 'Playful, needs standard bulldog checkups' },
      { owner_id: seededUsers[4].id, name: 'Luna', species: 'Cat', breed: 'Siamese', age: 3, gender: 'Female', health_info: 'Quiet, loves sleeping in warm spots' },
      { owner_id: seededUsers[4].id, name: 'Milo', species: 'Cat', breed: 'Tabby', age: 1, gender: 'Male', health_info: 'Energetic kitten, vaccinated' },
      { owner_id: seededUsers[0].id, name: 'Snowball', species: 'Rabbit', breed: 'Angora', age: 1, gender: 'Male', health_info: 'Very soft fur, likes carrots' }
    ];

    const seededPets = [];
    for (const p of pets) {
      const res = await dbRun(
        'INSERT INTO pets (owner_id, pet_name, species, breed, age, gender, health_info) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.owner_id, p.name, p.species, p.breed, p.age, p.gender, p.health_info]
      );
      seededPets.push({ id: res.id, ...p });
    }

    // Seed Pet Images
    const images = [
      { pet_id: seededPets[0].id, url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600' }, // Golden
      { pet_id: seededPets[1].id, url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600' }, // Bulldog
      { pet_id: seededPets[2].id, url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600' }, // Siamese
      { pet_id: seededPets[3].id, url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=600' }, // Tabby
      { pet_id: seededPets[4].id, url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600' }  // Rabbit
    ];

    for (const img of images) {
      await dbRun('INSERT INTO pet_images (pet_id, image_url) VALUES (?, ?)', [img.pet_id, img.url]);
    }

    // Seed Pet Listings
    const listings = [
      { pet_id: seededPets[0].id, type: 'sell', price: 800.0, status: 'active' },
      { pet_id: seededPets[1].id, type: 'adopt', price: 0.0, status: 'active' },
      { pet_id: seededPets[2].id, type: 'foster', price: 0.0, status: 'active' },
      { pet_id: seededPets[3].id, type: 'adopt', price: 0.0, status: 'active' },
      { pet_id: seededPets[4].id, type: 'sell', price: 150.0, status: 'active' }
    ];

    const seededListings = [];
    for (const l of listings) {
      const res = await dbRun(
        'INSERT INTO pet_listings (pet_id, listing_type, price, status) VALUES (?, ?, ?, ?)',
        [l.pet_id, l.type, l.price, l.status]
      );
      seededListings.push({ id: res.id, ...l });
    }

    // Seed Reviews
    await dbRun(
      'INSERT INTO reviews (reviewer_id, reviewed_user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [seededUsers[2].id, seededUsers[0].id, 5, 'Alice was amazing! Max was well cared for and all documents were ready.']
    );

    // Seed Messages
    await dbRun(
      'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
      [seededUsers[2].id, seededUsers[0].id, 'Hi Alice, is Max still available for adoption?']
    );
    await dbRun(
      'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
      [seededUsers[0].id, seededUsers[2].id, 'Yes, Max is active! He is very friendly. When would you like to visit?']
    );

    // Seed Notifications
    await dbRun(
      'INSERT INTO notifications (user_id, title, is_read) VALUES (?, ?, ?)',
      [seededUsers[0].id, 'You received a new inquiry on Max from Charlie Brown!', 0]
    );

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDb
};
