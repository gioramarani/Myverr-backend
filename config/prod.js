import dotenv from 'dotenv'

dotenv.config()

export default {
  dbURL: 'mongodb+srv://gioramarani:1234@cluster0.pdpj63k.mongodb.net/',
  dbName: 'WimHof_db',
}

// export default {
//   dbURL: process.env.ATLAS_URL,
//   dbName : process.env.ATLAS_DB_NAME,
// }

// export default {
//   dbURL: process.env.,
//   dbName : 'Myverrdb'
// }


