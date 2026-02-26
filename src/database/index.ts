import postgres from 'postgres';

const sql = postgres({
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME as string,
    username: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    idle_timeout: 20,
    max_lifetime: 60 * 30
});

const freeTrial = { duration: process.env.FREE_TRIAL_DAYS! };

const plans = {
    plans:
        [
            {
                months: 1,
                price: process.env.SUB_PRICE_1_MONTH!
            },
            {
                months: 3,
                price: process.env.SUB_PRICE_3_MONTHS!
            },
            {
                months: 6,
                price: process.env.SUB_PRICE_6_MONTHS!
            },
            {
                months: 12,
                price: process.env.SUB_PRICE_12_MONTHS!
            }
        ]
};

export const initDatabase = async () => {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                username VARCHAR(32),
                first_name VARCHAR(64),
                register TIMESTAMP DEFAULT NOW(),
                trial_key BOOLEAN DEFAULT FALSE,
                last_activity TIMESTAMP DEFAULT NOW(),
                ref_balance NUMERIC(10, 2) DEFAULT 0.00,
                ref_proc INT DEFAULT 15,
                sale INT DEFAULT 0,
                is_admin BOOLEAN DEFAULT FALSE,
                agreed_policy BOOLEAN DEFAULT FALSE,
                payload TEXT
            )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                uuid TEXT,
                username TEXT
            )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                service VARCHAR(32),
                payment_id TEXT,
                payment_time TIMESTAMP DEFAULT NOW(),
                amount NUMERIC(10, 2),
                status VARCHAR(32) DEFAULT 'pending',
                payload TEXT
            )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(64) UNIQUE,
                data JSONB
            )
        `;
        await sql`
            INSERT INTO settings (key, data)
            VALUES
                ('free_trial', ${JSON.stringify(freeTrial)}),
                ('plans', ${JSON.stringify(plans)})
            ON CONFLICT (key) DO NOTHING
        `;
        console.log('✅ База данных инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error);
        throw error;
    }
};

export default sql;