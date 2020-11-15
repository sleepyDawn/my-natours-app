// app.js version before refactoring of routes
const fs = require('fs');
const express = require('express');

const app = express();
app.use(express.json()); //adding middleware to access body data of request

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the serrver side!', app: 'Natours' }); //It will automatically set contentent type to application/json
//   console.log('root requested!!!');
// });

// app.post('/', (req, res) => {
//   console.log('getting the naturous app!!');
//   res.send('You can post to this end point!!');
// });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8')
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours, // In es6 we don't need to specify key and values if they have the same name
    },
  });
});

app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body);

  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
});

app.get('/api/v1/tours/:id', (req, res) => {
  // console.log(req.params);
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'failure',
      message: 'invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });

  // console.log(typeof tour);

  // fs.readFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   'utf-8',
  //   (err, data) => {
  //     const tours = JSON.parse(data);
  //     res.status(200).json({
  //       status: 'success',
  //       data: {
  //         tour: tours[id], // In es6 we don't need to specify key and values if they have the same name
  //       },
  //     });
  //   }
  // );
});

// Handling patch request
app.patch('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'failure',
      message: 'invalid ID',
    });
  }

  res.status(200).json({
    staus: 'success',
    data: {
      tour: '<Updated Tour>', //<> signify a placeholder!!
    },
  });
});

// Handling delete request
app.delete('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'failure',
      message: 'invalid ID',
    });
  }

  res.status(204).json({
    staus: 'success',
    data: null,
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port: ${port}...`);
});
