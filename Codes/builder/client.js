const UserBuilder = require('./user')

let user = new UserBuilder()
    .withAge(22)
    .withGender('F')
    .build()

console.log(user)