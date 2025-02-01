const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();
const port = 8080;

// Enable CORS for your frontend (replace with your actual frontend URL)
app.use(cors({
    origin: 'https://bl-de.vercel.app',  // Your frontend URL
    methods: ['GET', 'POST'],            // Allowed methods
    allowedHeaders: ['Content-Type']     // Allowed headers
}));

// Initialize Firebase Admin SDK directly with the credentials as an object
admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "blde-86d87",
        "private_key_id": "0ba098ba93fb05952a8159eb1ab5d2d8d1631af7",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCao6hLa6vo4Ef0\nLiVOTn+PC8I+5ks5xwZb0Rn7vWbjr1vTq/vGr9TxZ1V4o0rDuaHfhtJ+MGWrkJVq\nevylg5YYrS5e9Lc7SuZZIwaaEam69k+O+5TR7j+ZjJ9WupYg9lub6UePwMzGqp/l\n8iUb68pEPQXabYXTyqHtuoyeJ1zt3hiQyAw9cQ4Lt1QKQ/6LGQNNjqkSXrzeTne0\n9YJzv+WHCxLb/UbfU6qCVheq0Z73JI2bQQAlgE3+G4bQfZWn3OUfeN14fTpNMY0F\nwv45s5NvWKbmL2fq+3Vq5FNIVtWbKDR6Hv7f+zon9P9z3QXbt3GmO5fP29i5VFZJ\nAcyXz3h/AgMBAAECggEACZA3dzqYbhV4vbQg4H/gSaNrhuJNIqyZSxJabgQfmdMd\ndbC8KGR1YdyHH6fRltsjFKTM3br2fq65XtVuTHofzTTgmkS+FC+koTyWSu7utT5I\nW0pZwMXgLwnQTNfLMwypS7IYl95Pi7W/n8Pi4aAqaR/w/boqPZfZfc88pQdAKwGp\nm8F+rQ57wlQ5GMGqZjBvi566QipNvruntYULJVUnfIhGdpKk/YKrWF5uvPNhihDD\n5EjOqukdDygpk660GKok1PNfcrWiB9DhJ0NgQqAiLpPOyKXSbAWDPFQCkL7d3BGj\nPUtQPGWqSs88jIobMP218T14UtA3xnSJMVnB0eo+MQKBgQDLO2OZ1ohdbqPd8Gq2\nB0btR+Hy8pcFF8Bw1SJH2wlic/ZkogF2cO5kK0OK5K7qdB5d9h9EGeG/CZ8RYBgL\njMHKnukzW9ov8NRjyE5h65XePdiEBDEw6qU26GFgf0sQusQquQCELLKbDoJ1PozJ\n95L1O+A34yul6oOTXrUtEl6npwKBgQDCyl0n5dtPm18qv6q45CegKASkYdAv+P8v\n61Yfunx5/7RrmVplnNeLwQLQxsJ6Dsjrra2Eeszb3t7SC8KXudHNkEafbp4RJ3Bd\nVzFPDnxmw1hB7iUunEpqm5Jd7OUzitYngix30CfL2h/mYJoWrpYe38BGEq2igDiP\ngfUBUYRDaQKBgGAfXdOEMYknbF/rdz1TIcvWpNq4vI8PFdkIJaegxMaJHG+qZFC1\nxzsfb1nBIa4Ib9h3MYCPUUN+9HpOXfEQiRQhpyDAf+kO2hW7xr7vozmzPLXsGawO\nP0hCDtSKQGHQRDoEuGbLkUpfSXrUs9hOvXY59KnaS2m1CrhoIf8IYjafAoGABpqx\n2d5zNxm/ekWRVj92EHoK3j/qvRWmIUvLWbwK6GABD/zdEcDllflvTQDQKy9BJKx4\ny5sWQwYla922NUq5kEyp+FHZzh8WMjP4mgOVuC47WdDnNdNauo6XwdN8WekFJcXG\nGDHYh5LXrgnsb4Rv1pAjhryvYmkSgdsYIXlQELECgYACLuZY39T4bXvwITseGPif\n0PyI3eI52lMI9XpGtvKOx1SMs/h5k+8mzkdGtzmjHBbqZ20Tg9UzXrl3XK8KALMt\ntkAQDTemjIIkLPnW3HbuHJz9q3xaPbXfg/krfnqn7W05xi7WVBBuSclGsuLtlbpj\n6UYVr0pIvayaFyUCJPnmNA==\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@blde-86d87.iam.gserviceaccount.com",
        "client_id": "108071378955176505466",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40blde-86d87.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    })
});

const db = admin.firestore();  // Firestore instance for database operations

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to add a student
app.post('/add-student', async (req, res) => {
    const { studentId, studentName, semester, phone_number, email, dob, gender } = req.body;

    if (studentId && studentName && semester && phone_number && email && dob && gender) {
        try {
            // Adding student data to Firestore
            await db.collection('students').add({
                studentId,
                studentName,
                semester,
                phone_number,
                email,
                dob,
                gender
            });
            res.send('Student added successfully!');
        } catch (error) {
            console.error('Error adding student data:', error);
            return res.status(500).send('Error adding student.');
        }
    } else {
        res.status(400).send('Missing required fields.');
    }
});

// Endpoint to get students by semester
app.get('/students/:semester', async (req, res) => {
    const semester = req.params.semester;
    try {
        // Fetching students data from Firestore
        const studentsSnapshot = await db.collection('students')
            .where('semester', '==', semester)
            .get();

        const students = studentsSnapshot.docs.map(doc => doc.data());
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).send('Error fetching students.');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
