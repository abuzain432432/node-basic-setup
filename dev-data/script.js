const fs = require('fs');
const Tours = require('../modals/tourModal');
const User = require('../modals/userModal');
const Review = require('../modals/reviewModal');

const mongoose = require('mongoose');

const jsonToursData = fs.readFileSync(
  `${__dirname}/../dev-data/data/tours.json`,
  'utf-8'
);
const jsonUsersData = fs.readFileSync(
  `${__dirname}/../dev-data/data/users.json`,
  'utf-8'
);
const jsonReviewsData = fs.readFileSync(
  `${__dirname}/../dev-data/data/reviews.json`,
  'utf-8'
);
const clientOptions = {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
    autoIndex: true,
  },
};
const init = async () => {
  try {
    await mongoose.connect(
      process.env.DB_CONNECTION_STRING,
      clientOptions
    );
    await mongoose.connection.db.admin().command({ ping: 1 });
    const toursData = JSON.parse(jsonToursData);
    const usersData = JSON.parse(jsonUsersData);
    const reviewsData = JSON.parse(jsonReviewsData);

    await Tours.create(toursData, { validateBeforeSave: false });
    await User.create(usersData, { validateBeforeSave: false });
    await Review.create(reviewsData, { validateBeforeSave: false });
    console.log(
      '############### DATA INSERTED SUCCESSFULLY ##############'
    );
  } catch (err) {
    console.log(err);
  }
};
init();

// const fs = require('fs');
// const Tours = require('../modals/tourModal');
// const mongoose = require('mongoose');

// const jsonToursData = fs.readFileSync(
//   `${__dirname}/../dev-data/data/tours-simple.json`,
//   'utf-8'
// );
// const clientOptions = {
//   serverApi: {
//     version: '1',
//     strict: true,
//     deprecationErrors: true,
//     autoIndex: true,
//   },
// };
// const connectDb = async () => {
//   await mongoose.connect(
//     process.env.DB_CONNECTION_STRING,
//     clientOptions
//   );
//   await mongoose.connection.db.admin().command({ ping: 1 });
// };
// const importDbData = async () => {
//   try {
//     await connectDb();
//     const toursData = JSON.parse(jsonToursData);
//     const insertedTours = await Tours.insertMany(toursData);
//     console.log(
//       '################### Data Inserted #######################'
//     );
//   } catch (err) {
//     console.log(err);
//   }
// };
// const deleteDbData = async () => {
//   try {
//     await Tours.deleteMany();
//     console.log(
//       '################### Data Deleted #######################'
//     );
//   } catch (err) {
//     console.log(err);
//   }
// };
// if (process.argv[2] === '--import') {
//   importDbData();
// } else if (process.argv[2] === '--delete') {
//   deleteDbData();
// }
