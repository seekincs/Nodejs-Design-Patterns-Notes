const Sequelize = require('sequelize');

// 配置数据登录信息
let database = 'test';
let username = 'root';
let password = 'trayvonpan';
const sequelize = new Sequelize(database, username, password, {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// 测试连接
sequelize.authenticate().then(() => {
    console.log('success');
}).catch(() => {
    console.log('error');
});

const Model = Sequelize.Model;

class User extends Model {
}

// 定义 User 表的属性
User.init({
    firstName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    lastName: {
        type: Sequelize.STRING
    },
    age: {
        type: Sequelize.INTEGER
    }

}, {
    sequelize,
    moduleName: 'user'
});


let me = {
    firstName: 'Pan',
    lastName: 'Trayvonpan',
    age: 21
};

// 插入
User.sync({force: true}).then(() => {
    return User.create(me);
});

// 查询
User.findAll().then(users => {
    console.log("All users:", JSON.stringify(users, null, 4));
});

// 删除
User.destroy({
    where: {
        firstName: "Pan"
    }
}).then(() => {
    console.log("Done");
});

// 更新
User.update({ lastName: "Trayvon" }, {
    where: {
        lastName: null
    }
}).then(() => {
    console.log("Done");
});
