const { createApp } = Vue;

createApp({
    data() {
        return {
            // 用户状态
            currentUser: null,
            loginForm: {
                username: '',
                password: ''
            },
            loginError: '',

            // 房间相关
            rooms: [],
            selectedDate: this.getTodayDate(),
            activeTab: 'rooms',

            // 预定相关
            myBookings: [],
            showBookingModal: false,
            selectedRoom: {},
            bookingForm: {
                date: this.getTodayDate(),
                timeSlot: '',
                contactName: '',
                contactPhone: '',
                notes: ''
            },

            // 用户管理相关
            managers: [],
            showUserModal: false,
            editingUser: {
                id: '',
                username: '',
                password: '',
                name: '',
                phone: ''
            },

            // Toast提示
            toast: {
                show: false,
                message: '',
                type: 'success'
            }
        };
    },
    mounted() {
        this.checkLoginStatus();
    },
    methods: {
        // 获取今天的日期
        getTodayDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        },

        // 检查登录状态
        async checkLoginStatus() {
            try {
                const response = await fetch('/api/current-user');
                const data = await response.json();
                if (data.success) {
                    this.currentUser = data.user;
                    this.loadRooms();
                }
            } catch (err) {
                console.error('检查登录状态失败', err);
            }
        },

        // 登录
        async handleLogin() {
            this.loginError = '';
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.loginForm)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.currentUser = data.user;
                    this.loadRooms();
                    this.showToast('登录成功', 'success');
                } else {
                    this.loginError = data.message;
                }
            } catch (err) {
                this.loginError = '登录失败，请检查网络';
                console.error('登录失败', err);
            }
        },

        // 登出
        async handleLogout() {
            try {
                await fetch('/api/logout', { method: 'POST' });
                this.currentUser = null;
                this.rooms = [];
                this.myBookings = [];
                this.loginForm = { username: '', password: '' };
                this.showToast('已退出登录', 'success');
            } catch (err) {
                console.error('登出失败', err);
            }
        },

        // 加载房间列表
        async loadRooms() {
            try {
                const response = await fetch('/api/rooms');
                const data = await response.json();
                if (data.success) {
                    this.rooms = data.rooms;
                }
            } catch (err) {
                console.error('加载房间失败', err);
            }
        },

        // 打开预定弹窗
        openBookingModal(room) {
            this.selectedRoom = room;
            this.bookingForm = {
                date: this.selectedDate,
                timeSlot: '',
                contactName: this.currentUser.name || '',
                contactPhone: this.currentUser.phone || '',
                notes: ''
            };
            this.showBookingModal = true;
        },

        // 提交预定
        async submitBooking() {
            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomId: this.selectedRoom.id,
                        date: this.bookingForm.date,
                        timeSlot: this.bookingForm.timeSlot,
                        contactName: this.bookingForm.contactName,
                        contactPhone: this.bookingForm.contactPhone,
                        notes: this.bookingForm.notes
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.showBookingModal = false;
                    this.loadRooms();
                    this.showToast('预定成功', 'success');
                } else {
                    this.showToast(data.message, 'error');
                }
            } catch (err) {
                this.showToast('预定失败，请重试', 'error');
                console.error('预定失败', err);
            }
        },

        // 取消预定
        async cancelBooking(booking) {
            if (!confirm('确定要取消这个预定吗？')) {
                return;
            }

            try {
                const response = await fetch(`/api/bookings/${booking.id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    this.loadRooms();
                    this.loadBookings();
                    this.showToast('预定已取消', 'success');
                } else {
                    this.showToast(data.message, 'error');
                }
            } catch (err) {
                this.showToast('取消失败，请重试', 'error');
                console.error('取消预定失败', err);
            }
        },

        // 加载预定记录
        async loadBookings() {
            try {
                const response = await fetch('/api/bookings');
                const data = await response.json();
                if (data.success) {
                    this.myBookings = data.bookings;
                }
            } catch (err) {
                console.error('加载预定记录失败', err);
            }
        },

        // 加载用户列表
        async loadUsers() {
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                if (data.success) {
                    this.managers = data.users.managers;
                }
            } catch (err) {
                console.error('加载用户列表失败', err);
            }
        },

        // 打开用户编辑弹窗
        openUserModal(manager = null) {
            if (manager) {
                this.editingUser = { ...manager, password: '' };
            } else {
                this.editingUser = {
                    id: '',
                    username: '',
                    password: '',
                    name: '',
                    phone: ''
                };
            }
            this.showUserModal = true;
        },

        // 提交用户编辑
        async submitUser() {
            try {
                const response = await fetch('/api/users/manager', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.editingUser)
                });

                const data = await response.json();

                if (data.success) {
                    this.showUserModal = false;
                    this.loadUsers();
                    this.showToast(data.message, 'success');
                } else {
                    this.showToast(data.message, 'error');
                }
            } catch (err) {
                this.showToast('保存失败，请重试', 'error');
                console.error('保存用户失败', err);
            }
        },

        // 删除经理
        async deleteManager(id) {
            if (!confirm('确定要删除这个经理账号吗？')) {
                return;
            }

            try {
                const response = await fetch(`/api/users/manager/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    this.loadUsers();
                    this.showToast('删除成功', 'success');
                } else {
                    this.showToast(data.message, 'error');
                }
            } catch (err) {
                this.showToast('删除失败，请重试', 'error');
                console.error('删除用户失败', err);
            }
        },

        // 显示Toast提示
        showToast(message, type = 'success') {
            this.toast = { show: true, message, type };
            setTimeout(() => {
                this.toast.show = false;
            }, 3000);
        }
    },
    watch: {
        selectedDate(newVal) {
            this.bookingForm.date = newVal;
        }
    }
}).mount('#app');
