const axios = require('axios');
async function test() {
    try {
        const response = await axios.get('http://127.0.0.1:8000/api/compliance/agreements');
        console.log(response.data.slice(0, 5));
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
test();
