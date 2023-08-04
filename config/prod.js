import dotenv from 'dotenv'

dotenv.config()

// export default {
//   dbURL: 'mongodb+srv://theUser:thePass@cluster0-klgzh.mongodb.net/test?retryWrites=true&w=majority',
//   dbName : 'tester_db'
// }

// export default {
//   dbURL: 'mongodb+srv://gioramarani:1234@cluster0.pdpj63k.mongodb.net/',
//   dbName : 'Myverrdb'
// }

export default {
  dbURL: process.env.ATLAS_URL,
  dbName : process.env.ATLAS_DB_NAME,
}

// export default {
//   dbURL: process.env.,
//   dbName : 'Myverrdb'
// }


