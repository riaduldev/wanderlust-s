
import express from 'express';
import cors from 'cors'
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors({
    origin: "https://wanderlust-c.vercel.app"
}));

const PORT = process.env.PORT || 8000;

// MongoDB connection
const client = new MongoClient(process.env.M_DB_URI);

export async function connectToMongoDB() {
    try {
        await client.connect();

        console.log("You successfully connected to MongoDB!");

        return client;
    } catch (err) {
        console.error("MongoDB connection failed:", err);
        throw err;
    }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db('wanderlust')
const destinationCollection = db.collection('destination')

// Middleware
app.use(express.json());

// POST API
app.post('/add-destination', async(req, res) => {
    const data = req.body;

    const result =await destinationCollection.insertOne(data)


    res.send(result);
});

app.get("/destinations" , async(req, res) => {
    const result = await destinationCollection.find().toArray();
    res.send(result)
})

// UPDATE API
app.put('/update-destination/:id', async(req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid destination id' });
    }

    // _id is immutable in MongoDB — never send it to $set
    const { _id, ...updatedData } = req.body;

    const result = await destinationCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
    );

    if (result.matchedCount === 0) {
        return res.status(404).send({ message: 'Destination not found' });
    }

    res.send(result);
});

// DELETE API
app.delete('/delete-destination/:id', async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid destination id' });
    }

    const result = await destinationCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
        return res.status(404).send({ message: 'Destination not found' });
    }

    res.send(result);
});

// GET API
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start server after MongoDB connection
async function startServer() {
    try {
        await connectToMongoDB();

        app.listen(PORT, () => {
            console.log(`Example app listening on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server failed to start:", error);
    }
}

startServer();
