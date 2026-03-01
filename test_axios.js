const axios = require('axios');

async function test() {
    try {
        const login = await axios.post('http://localhost:8000/api/login', {
            username: 'admin',
            password: 'password' // Will try the provided one
        });
        
    } catch(e) {
        // ...
    }
}
