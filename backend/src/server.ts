import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AccountingHub API running on port ${PORT}`);
});
