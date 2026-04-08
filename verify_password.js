const bcrypt = require('bcrypt');
const hash = '$2b$10$z1pqM9NDOFxVBi5zZXuuuu0oiHt9hV7bsgJSrW7Z8FE/ivSmNMY56';
const password = 'admingbmoney4972';

bcrypt.compare(password, hash).then(match => {
    console.log(`Password 'admingbmoney4972' matches new hash: ${match}`);
});
