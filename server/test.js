import bcrypt from "bcryptjs";

const hash = "$2b$10$yQZhvWIO5ac75Y9se/yKxemUnqBX/b8lOVFAh5Z5EK8sz.zI5b9SO";
const pass = "faisal0404";

bcrypt.compare(pass, hash)
  .then(ok => console.log("Manual compare result:", ok))
  .catch(err => console.error(err));
