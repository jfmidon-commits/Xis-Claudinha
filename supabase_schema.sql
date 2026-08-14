-- ============================================================
-- SCHEMA DO BANCO - XIS DA CLAUDINHA
-- Execute tudo no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  category text NOT NULL DEFAULT 'Xiss',
  is_available boolean DEFAULT true,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Criar tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]',
  total decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  payment_method text NOT NULL DEFAULT 'pix',
  payment_status text NOT NULL DEFAULT 'pendente',
  address jsonb NOT NULL DEFAULT '{}',
  customer_phone text,
  delivery_location jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),

  CONSTRAINT valid_status CHECK (status IN ('pendente','confirmado','preparando','saiu_entrega','entregue','cancelado')),
  CONSTRAINT valid_payment CHECK (payment_method IN ('pix','dinheiro','cartao'))
);

-- 3. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. DESATIVAR RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 7. Dados de exemplo
INSERT INTO products (name, description, price, category, is_available) VALUES
  ('Xis Salada', 'Hambúrguer, queijo, alface, tomate e maionese', 28.00, 'Xiss', true),
  ('Xis Bacon', 'Hambúrguer, queijo, bacon crocante e maionese', 32.00, 'Xiss', true),
  ('Xis Egg', 'Hambúrguer, queijo, ovo e maionese', 30.00, 'Xiss', true),
  ('Xis Completo', 'Hambúrguer, queijo, bacon, ovo, alface, tomate', 38.00, 'Xiss', true),
  ('Xis Tudo', 'Hambúrguer duplo, queijo, bacon, ovo, calabresa, alface, tomate', 45.00, 'Xiss', true),
  ('Dog Simples', 'Salsicha, molho e batata palha', 15.00, 'Cachorro-Quente', true),
  ('Dog Completo', 'Salsicha, queijo, bacon, molho e batata palha', 22.00, 'Cachorro-Quente', true)
ON CONFLICT DO NOTHING;
