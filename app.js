const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { type } = require('os');
port = 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://Subash:717822p153@cluster0.anirp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(()=>{
    console.log('Database Connected');
}).catch((err)=>{
    console.log(err);
});

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));

const UserSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    }
});

const User = mongoose.model('User',UserSchema);

const MovieSchema = new mongoose.Schema({
    name:String,
    photo:String,
    ticketPrice:Number,
    rating:Number
});

const Movie = mongoose.model('Movie',MovieSchema);

const bookingSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    movieId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Movie'
    },
    tickets:{
        type:Number,
        required:true
    },
    bookedAt:{
        type:Date,
        default:Date.now
    }
});

const Booking = mongoose.model('Booking',bookingSchema);


app.get('/',(req,res)=>{
    res.render('index');
});

app.get('/user/login',(req,res)=>{
    res.render('user-login');
});

app.get('/user/register',(req,res)=>{
    res.render('user-register');
});

app.post('/user/register',async(req,res)=>{
    const {name,email,password} = req.body;

    try{
        const extingUser = await User.findOne({email});
        if(extingUser){
            return res.send('User Already Exists');
        }
        const newUser = new User({
            name,
            email,
            password
        });
        newUser.save();
        res.send('Registration Success');
    }
    catch(err){
        console.log(err);
    }
});

app.post('/user/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, role: 'user' });
        if (!user) {
            return res.send('User not found.');
        }

        if (user.password !== password) {
            return res.send('Incorrect password.');
        }
        res.redirect(`/user/dashboard/${user._id}`);
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Error logging in.');
    }
});

app.get('/admin/login',(req,res)=>{
    res.render('admin-login');
});

app.get('/admin/register',(req,res)=>{
    res.render('admin-register');
});

app.post('/admin/register',async(req,res)=>{
    const {name,email,password} = req.body;

    try{
        const extingUser = await User.findOne({email});
        if(extingUser){
            return res.send('User Already Exists');
        }
        const newUser = new User({
            name,
            email,
            password,
            role:'admin'
        });
        newUser.save();
        res.send('Registration Success');
    }
    catch(err){
        console.log(err);
    }
});

app.post('/admin/login',async(req,res)=>{
    const {email,password} = req.body;

    try{
        const user = await User.findOne({email});
        if(!user){
            return res.send('User Not Found');
        }
        if(user.password !== password){
            return res.send('Password Incorrect');
        }
        if(user.role !== 'admin'){
            return res.send('User Not Admin');
        }
        res.redirect('/admin/dashboard');
    }
    catch(err){
        console.log(err);
    }
});

app.get('/admin/dashboard',async(req,res)=>{
    res.render('admin-dashboard');
});

app.get('/user/dashboard/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send('Invalid user ID.');
        }

        const movies = await Movie.find(); 
        const userBookings = await Booking.find({ userId }).populate('movieId'); 

        console.log(userBookings); // Debugging: Log the userBookings data

        res.render('user-dashboard', { movies, userBookings, userId });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data.');
    }
});

app.post('/user/book-movie/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { movieId, tickets } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).send('Invalid user ID or movie ID.');
        }

        if (isNaN(tickets) || tickets < 1) {
            return res.status(400).send('Invalid number of tickets.');
        }

        const newBooking = new Booking({ userId, movieId, tickets });
        await newBooking.save();
        res.redirect(`/user/dashboard/${userId}`);
    } catch (err) {
        console.error('Error booking movie:', err);
        res.status(500).send('Error booking movie.');
    }
});

app.post('/admin/add-movie',async(req,res)=>{
    const {name,photo,ticketPrice,rating} = req.body;

    try{
        const newMovie = new Movie({
            name,
            photo,
            ticketPrice,
            rating
        });
        newMovie.save();
        res.send('Movie Added');
    }
    catch(err){
        console.log(err);
    }
});

app.listen(port,()=>{
    console.log('Server Started');
});
