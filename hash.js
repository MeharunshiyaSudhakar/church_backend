const bcrypt = require("bcrypt");

(async () => {
  const plain = "Admin@123";  // 👈 This will be your admin login password
  const hash = await bcrypt.hash(plain, 10);
  console.log("HASHED PASSWORD:", hash);
})();
