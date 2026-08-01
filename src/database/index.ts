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

const freeTrial = { duration: Number(process.env.FREE_TRIAL_DAYS!) };
const limitExtend = {
    devices: Number(process.env.EXTEND_DEVICE_COUNT!),
    price: Number(process.env.EXTEND_DEVICE_PRICE!)
};
const globalSale = {
    sale: 0
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
                is_active BOOLEAN DEFAULT TRUE,
                agreed_policy BOOLEAN DEFAULT FALSE,
                payload TEXT
            )
        `;
        // TEMP uuid
        await sql`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                uuid TEXT,
                rw_user_id BIGINT,
                username TEXT,
                is_limit_extended BOOLEAN DEFAULT FALSE
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
                months INT,
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
                ('free_trial', ${sql.json(freeTrial)}),
                ('limit_extend', ${sql.json(limitExtend)}),
                ('global_sale', ${sql.json(globalSale)})
            ON CONFLICT (key) DO NOTHING
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS operating_systems (
                id SERIAL PRIMARY KEY,
                name VARCHAR(32) UNIQUE NOT NULL,
                button_style VARCHAR(32),
                priority INTEGER DEFAULT 0
            )
        `;
        await sql`
            INSERT INTO operating_systems (name, priority)
            VALUES
                ('iOS', 40),
                ('Android', 30),
                ('Windows', 20),
                ('MacOS', 10),
                ('Linux', 0)
            ON CONFLICT (name) DO NOTHING;
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS vpn_clients (
                id SERIAL PRIMARY KEY,
                operating_system_id INTEGER REFERENCES operating_systems(id) ON DELETE CASCADE,
                name VARCHAR(32) NOT NULL,
                link TEXT,
                button_style VARCHAR(32),
                priority INTEGER DEFAULT 0
            )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS sub_prices (
                id SERIAL PRIMARY KEY,
                months INT UNIQUE NOT NULL,
                amount NUMERIC(10, 2)
            )
        `;
        await sql`
            INSERT INTO sub_prices (months, amount)
            VALUES 
                (1, ${process.env.SUB_PRICE_1_MONTH!}),
                (3, ${process.env.SUB_PRICE_3_MONTHS!}),
                (6, ${process.env.SUB_PRICE_6_MONTHS!}),
                (12, ${process.env.SUB_PRICE_12_MONTHS!})
            ON CONFLICT (months) DO NOTHING
        `;
        console.log('✅ База данных инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error);
        throw error;
    }
};

export default sql;