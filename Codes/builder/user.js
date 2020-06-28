class UserBuilder {

    withAge(age = 21) {
        this.age = age;
        return this;
    }

    withGender(gender = 'M') {
        this.gender = gender;
        return this;
    }

    build() {
        return new User(this);
    }
}

class User {
    constructor({age, gender}) {
        this.age = age;
        this.gender = gender;
    }
}

module.exports = UserBuilder

