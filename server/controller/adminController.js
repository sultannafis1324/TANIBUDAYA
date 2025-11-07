const getDashboard = (req, res) => {
    res.send("Ini dashboard admin");
};

const createUser = (req, res) => {
    const { name, email } = req.body;
    // logika simpan user ke database
    res.json({ message: `User ${name} berhasil dibuat!` });
};

module.exports = { getDashboard, createUser };
