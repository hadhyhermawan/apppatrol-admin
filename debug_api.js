const axios = require('axios');
axios.get('http://127.0.0.1:8000/api/compliance/agreements')
    .then(r => console.log(r.data))
    .catch(e => console.error(e.response ? e.response.data : e.message));
