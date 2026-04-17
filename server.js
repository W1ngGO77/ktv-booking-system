const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 确保数据目录存在
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化 SQLite 数据库
const DB_PATH = path.join(DATA_DIR, 'ktv.db');
let db;

// 初始化数据库和表
function initDatabase() {
    db = new Database(DB_PATH);
    
    // 创建房间表
    db.exec(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            minPrice REAL NOT NULL,
            capacity INTEGER DEFAULT 0,
            features TEXT DEFAULT '',
            status TEXT DEFAULT 'available'
        )
    `);
    
    // 创建用户表（管理员和经理）
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            phone TEXT,
            role TEXT NOT NULL,
            type TEXT DEFAULT 'manager'
        )
    `);
    
    // 创建预定表
    db.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            roomId TEXT NOT NULL,
            roomName TEXT NOT NULL,
            date TEXT NOT NULL,
            timeSlot TEXT NOT NULL,
            contactName TEXT,
            contactPhone TEXT,
            notes TEXT,
            managerId TEXT NOT NULL,
            managerName TEXT,
            createdAt TEXT NOT NULL,
            status TEXT DEFAULT 'active'
        )
    `);
    
    // 初始化默认数据
    initDefaultData();
}

// 初始化默认数据
function initDefaultData() {
    // 检查是否已有房间数据
    const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
    
    if (roomCount.count === 0) {
        // 插入默认房间
        const defaultRooms = [
            {id: '38', name: '38号房', minPrice: 2280, capacity: 0, features: ''},
            {id: '40', name: '40号房', minPrice: 2280, capacity: 0, features: ''},
            {id: '9', name: '9号房', minPrice: 2380, capacity: 0, features: ''},
            {id: '10', name: '10号房', minPrice: 2380, capacity: 0, features: ''},
            {id: '8', name: '8号房', minPrice: 2980, capacity: 0, features: ''},
            {id: '15', name: '15号房', minPrice: 2980, capacity: 0, features: ''},
            {id: '28', name: '28号房', minPrice: 2980, capacity: 0, features: ''},
            {id: '31', name: '31号房', minPrice: 2980, capacity: 0, features: ''},
            {id: '33', name: '33号房', minPrice: 2980, capacity: 0, features: ''},
            {id: '35', name: '35号房', minPrice: 2980, capacity: 0, features: ''},
            {id: '2', name: '2号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '3', name: '3号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '29', name: '29号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '30', name: '30号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '32', name: '32号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '36', name: '36号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '222', name: '222号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '555', name: '555号房', minPrice: 3580, capacity: 0, features: ''},
            {id: '39', name: '39号房', minPrice: 3980, capacity: 0, features: ''},
            {id: '6', name: '6号房', minPrice: 4280, capacity: 0, features: ''},
            {id: '20', name: '20号房', minPrice: 4280, capacity: 0, features: ''},
            {id: '333', name: '333号房', minPrice: 4680, capacity: 0, features: ''},
            {id: '111', name: '111号房', minPrice: 4980, capacity: 0, features: ''},
            {id: '666', name: '666号房', minPrice: 4980, capacity: 0, features: ''},
            {id: '999', name: '999号房', minPrice: 4980, capacity: 0, features: ''},
            {id: '888', name: '888号房', minPrice: 5380, capacity: 0, features: ''}
        ];
        
        const insertRoom = db.prepare('INSERT INTO rooms (id, name, minPrice, capacity, features) VALUES (?, ?, ?, ?, ?)');
        for (const room of defaultRooms) {
            insertRoom.run(room.id, room.name, room.minPrice, room.capacity, room.features);
        }
        console.log('默认房间数据已初始化');
    }
    
    // 检查是否已有用户数据
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    if (userCount.count === 0) {
        // 插入管理员
        db.prepare('INSERT INTO users (id, username, password, name, role, type) VALUES (?, ?, ?, ?, ?, ?)')
            .run('admin', 'admin', 'admin123', '管理员', 'admin', 'admin');
        
        // 插入经理
        const managers = [
            {id: 'M001', username: 'manager1', password: 'ktv2024', name: '张经理', phone: '13800138001'},
            {id: 'M002', username: 'manager2', password: 'ktv2024', name: '李经理', phone: '13800138002'},
            {id: 'M003', username: 'manager3', password: 'ktv2024', name: '王经理', phone: '13800138003'}
        ];
        
        const insertManager = db.prepare('INSERT INTO users (id, username, password, name, phone, role, type) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const m of managers) {
            insertManager.run(m.id, m.username, m.password, m.name, m.phone, 'manager', 'manager');
        }
        console.log('默认用户数据已初始化');
    }
}

// 验证登录
function authenticate(username, password) {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
        return user;
    }
    return null;
}

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'longlin-mansion-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24小时
}));

// API路由

// 登录
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: '请输入用户名和密码' });
    }

    const user = authenticate(username, password);
    
    if (user) {
        req.session.user = user;
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                name: user.name || (user.type === 'admin' ? '管理员' : '经理'),
                type: user.type
            }
        });
    } else {
        res.json({ success: false, message: '用户名或密码错误' });
    }
});

// 登出
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 获取当前用户
app.get('/api/current-user', (req, res) => {
    if (req.session.user) {
        res.json({
            success: true,
            user: {
                id: req.session.user.id,
                username: req.session.user.username,
                name: req.session.user.name || (req.session.user.type === 'admin' ? '管理员' : '经理'),
                type: req.session.user.type
            }
        });
    } else {
        res.json({ success: false, user: null });
    }
});

// 获取房间列表
app.get('/api/rooms', (req, res) => {
    const rooms = db.prepare('SELECT * FROM rooms').all();
    const bookings = db.prepare('SELECT * FROM bookings WHERE status = ?').all('active');
    
    if (!rooms) {
        return res.json({ success: false, message: '无法读取房间数据' });
    }

    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0];

    // 更新房间状态
    const roomsWithStatus = rooms.map(room => {
        // 检查是否有今天的有效预定
        const activeBooking = bookings.find(b => 
            b.roomId === room.id && 
            b.date === today
        );

        return {
            ...room,
            status: activeBooking ? 'booked' : 'available',
            booking: activeBooking || null
        };
    });

    res.json({ success: true, rooms: roomsWithStatus });
});

// 获取所有预定（管理员）
app.get('/api/bookings', (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: '请先登录' });
    }

    const bookings = db.prepare('SELECT * FROM bookings WHERE status = ?').all('active');
    
    // 如果是经理，只能看到自己的预定
    if (req.session.user.type === 'manager') {
        const myBookings = bookings.filter(b => b.managerId === req.session.user.id);
        return res.json({ success: true, bookings: myBookings });
    }

    // 管理员可以看到所有预定
    res.json({ success: true, bookings });
});

// 预定房间
app.post('/api/bookings', (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: '请先登录' });
    }

    const { roomId, date, timeSlot, contactName, contactPhone, notes } = req.body;

    if (!roomId || !date || !timeSlot) {
        return res.json({ success: false, message: '请填写完整的预定信息' });
    }

    // 检查房间是否存在
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
        return res.json({ success: false, message: '房间不存在' });
    }

    // 检查是否已被预定
    const existingBooking = db.prepare(
        'SELECT * FROM bookings WHERE roomId = ? AND date = ? AND timeSlot = ? AND status = ?'
    ).get(roomId, date, timeSlot, 'active');

    if (existingBooking) {
        return res.json({ success: false, message: '该时间段已被预定' });
    }

    // 创建预定
    const newBooking = {
        id: Date.now().toString(),
        roomId,
        roomName: room.name,
        date,
        timeSlot,
        contactName: contactName || req.session.user.name,
        contactPhone: contactPhone || req.session.user.phone || '',
        notes: notes || '',
        managerId: req.session.user.id,
        managerName: req.session.user.name,
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    try {
        db.prepare(`
            INSERT INTO bookings (id, roomId, roomName, date, timeSlot, contactName, contactPhone, notes, managerId, managerName, createdAt, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            newBooking.id,
            newBooking.roomId,
            newBooking.roomName,
            newBooking.date,
            newBooking.timeSlot,
            newBooking.contactName,
            newBooking.contactPhone,
            newBooking.notes,
            newBooking.managerId,
            newBooking.managerName,
            newBooking.createdAt,
            newBooking.status
        );
        res.json({ success: true, booking: newBooking });
    } catch (err) {
        console.error('预定保存失败:', err);
        res.json({ success: false, message: '预定保存失败' });
    }
});

// 取消预定
app.delete('/api/bookings/:id', (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: '请先登录' });
    }

    const bookingId = req.params.id;

    // 找到预定
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    
    if (!booking) {
        return res.json({ success: false, message: '预定不存在' });
    }

    // 检查权限：经理只能取消自己的预定，管理员可以取消任何预定
    if (req.session.user.type === 'manager' && booking.managerId !== req.session.user.id) {
        return res.json({ success: false, message: '您只能取消自己预定的房间' });
    }

    try {
        // 更新预定状态为已取消
        db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', bookingId);
        res.json({ success: true, message: '预定已取消' });
    } catch (err) {
        console.error('取消预定失败:', err);
        res.json({ success: false, message: '取消预定失败' });
    }
});

// 获取用户列表（管理员）
app.get('/api/users', (req, res) => {
    if (!req.session.user || req.session.user.type !== 'admin') {
        return res.json({ success: false, message: '需要管理员权限' });
    }

    const admin = db.prepare('SELECT * FROM users WHERE type = ?').get('admin');
    const managers = db.prepare('SELECT * FROM users WHERE type = ?').all('manager');
    
    res.json({ 
        success: true, 
        users: {
            admin: admin,
            managers: managers
        }
    });
});

// 添加/更新经理（管理员）
app.post('/api/users/manager', (req, res) => {
    if (!req.session.user || req.session.user.type !== 'admin') {
        return res.json({ success: false, message: '需要管理员权限' });
    }

    const { id, username, password, name, phone } = req.body;

    if (!username || !password || !name) {
        return res.json({ success: false, message: '请填写完整的经理信息' });
    }

    try {
        if (id) {
            // 更新
            db.prepare('UPDATE users SET username = ?, password = ?, name = ?, phone = ? WHERE id = ?')
                .run(username, password, name, phone || '', id);
            res.json({ success: true, message: '经理信息已更新' });
        } else {
            // 新增
            const maxId = db.prepare('SELECT MAX(CAST(SUBSTR(id, 2) AS INTEGER)) as maxId FROM users WHERE id LIKE ?').get('M%');
            const newId = 'M' + String((maxId.maxId || 0) + 1).padStart(3, '0');
            
            db.prepare('INSERT INTO users (id, username, password, name, phone, role, type) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(newId, username, password, name, phone || '', 'manager', 'manager');
            res.json({ success: true, message: '经理添加成功' });
        }
    } catch (err) {
        console.error('保存失败:', err);
        res.json({ success: false, message: '保存失败' });
    }
});

// 删除经理（管理员）
app.delete('/api/users/manager/:id', (req, res) => {
    if (!req.session.user || req.session.user.type !== 'admin') {
        return res.json({ success: false, message: '需要管理员权限' });
    }

    const managerId = req.params.id;

    try {
        db.prepare('DELETE FROM users WHERE id = ? AND type = ?').run(managerId, 'manager');
        res.json({ success: true, message: '经理已删除' });
    } catch (err) {
        console.error('删除失败:', err);
        res.json({ success: false, message: '删除失败' });
    }
});

// 添加/更新房间（管理员）
app.post('/api/rooms', (req, res) => {
    if (!req.session.user || req.session.user.type !== 'admin') {
        return res.json({ success: false, message: '需要管理员权限' });
    }

    const { id, name, minPrice, capacity, features } = req.body;

    if (!name || minPrice === undefined) {
        return res.json({ success: false, message: '请填写房间名称和低消价格' });
    }

    try {
        if (id) {
            // 更新
            db.prepare('UPDATE rooms SET name = ?, minPrice = ?, capacity = ?, features = ? WHERE id = ?')
                .run(name, Number(minPrice), Number(capacity) || 0, features || '', id);
            res.json({ success: true, message: '房间已更新' });
        } else {
            // 新增
            const maxId = db.prepare('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM rooms').get();
            const newId = String((maxId.maxId || 0) + 1).padStart(3, '0');
            
            db.prepare('INSERT INTO rooms (id, name, minPrice, capacity, features, status) VALUES (?, ?, ?, ?, ?, ?)')
                .run(newId, name, Number(minPrice), Number(capacity) || 0, features || '', 'available');
            res.json({ success: true, message: '房间添加成功' });
        }
    } catch (err) {
        console.error('保存失败:', err);
        res.json({ success: false, message: '保存失败' });
    }
});

// 删除房间（管理员）
app.delete('/api/rooms/:id', (req, res) => {
    if (!req.session.user || req.session.user.type !== 'admin') {
        return res.json({ success: false, message: '需要管理员权限' });
    }

    const roomId = req.params.id;

    try {
        db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
        res.json({ success: true, message: '房间已删除' });
    } catch (err) {
        console.error('删除失败:', err);
        res.json({ success: false, message: '删除失败' });
    }
});

// 初始化数据库
initDatabase();

// 启动服务器
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  珑临公馆KTV订房管理系统`);
    console.log(`  服务器已启动: http://localhost:${PORT}`);
    console.log(`  数据库: ${DB_PATH}`);
    console.log(`========================================`);
    console.log(`  管理员账号: admin / admin123`);
    console.log(`  经理账号: manager1 / ktv2024`);
    console.log(`========================================`);
});
