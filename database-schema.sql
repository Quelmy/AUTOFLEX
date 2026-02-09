-- database-schema.sql
CREATE DATABASE inventory_planner;

-- Conecte ao banco e execute:

-- Tabela de matérias-primas
CREATE TABLE raw_materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'un',
    unit_price DECIMAL(10,2) DEFAULT 0.00
);

-- Tabela de produtos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    value DECIMAL(10,2) NOT NULL
);

-- Tabela de associação produto-matéria-prima
CREATE TABLE product_materials (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    required_quantity INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    UNIQUE(product_id, raw_material_id)
);

-- Insira alguns dados de exemplo (opcional)
INSERT INTO raw_materials (code, name, quantity, unit_price) VALUES
('MAT001', 'Aço Inoxidável', 150, 25.00),
('MAT002', 'Plástico ABS', 300, 15.00),
('MAT003', 'Parafuso 5mm', 1000, 0.50);

INSERT INTO products (code, name, value) VALUES
('PROD001', 'Bicicleta Elétrica', 2500.00),
('PROD002', 'Cadeira de Escritório', 850.00),
('PROD003', 'Suporte para Notebook', 120.00);