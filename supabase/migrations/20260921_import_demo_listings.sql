insert into public.listings (
  user_id, title, type, status, price, bedrooms, bathrooms, area,
  city, neighborhood, address, description, image, advertiser, phone,
  latitude, longitude
)
select
  u.id, demo.title, demo.type, 'Disponível', demo.price, demo.bedrooms,
  demo.bathrooms, demo.area, 'Ipuã-SP', demo.neighborhood, demo.address,
  demo.description, demo.image, demo.advertiser, demo.phone,
  demo.latitude, demo.longitude
from auth.users u
cross join (values
  ('Residência perto da praça', 'venda', 'R$ 320.000', 3, 2, 120, 'Centro', 'Rua 15 de Novembro, Centro, Ipuã-SP', 'Casa confortável próxima à praça, com ambientes bem iluminados, cozinha planejada e espaço para a família.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', 'Maria Silva', '(16) 99999-1234', -20.4388, -48.0124),
  ('Casa com área de lazer', 'venda', 'R$ 420.000', 4, 3, 180, 'Jardim das Flores', 'Rua das Acácias, Jardim das Flores, Ipuã-SP', 'Casa ampla com área de lazer, quintal e espaços ideais para receber a família nos fins de semana.', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85', 'João Oliveira', '(16) 98888-4567', -20.4354, -48.0079),
  ('Apartamento para alugar', 'aluguel', 'R$ 1.800/mês', 2, 1, 85, 'Vila Nova', 'Avenida Carlos Roberto, Vila Nova, Ipuã-SP', 'Apartamento prático, bem localizado e próximo aos principais serviços e comércios de Ipuã.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85', 'Ana Costa', '(16) 97777-8910', -20.4421, -48.0172),
  ('Terreno pronto para construir', 'terreno', 'R$ 180.000', 0, 0, 600, 'Zona Norte', 'Rua Projetada 4, Zona Norte, Ipuã-SP', 'Terreno pronto para construir, com acesso fácil e espaço para um novo projeto residencial.', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85', 'Carlos Mendes', '(16) 96666-2345', -20.4307, -48.0161),
  ('Casa térrea com garagem', 'venda', 'R$ 285.000', 2, 1, 96, 'Jardim Primavera', 'Rua das Palmeiras, Jardim Primavera, Ipuã-SP', 'Casa térrea com garagem, dois quartos e quintal, pronta para receber uma nova família.', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85', 'Marcos Lima', '(16) 95555-3456', -20.4412, -48.0096),
  ('Apartamento central mobiliado', 'aluguel', 'R$ 1.450/mês', 1, 1, 58, 'Centro', 'Rua Sete de Setembro, Centro, Ipuã-SP', 'Apartamento mobiliado no centro, com fácil acesso a mercados, farmácias e serviços.', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85', 'Fernanda Alves', '(16) 94444-7890', -20.4371, -48.0148),
  ('Lote residencial plano', 'terreno', 'R$ 95.000', 0, 0, 250, 'Residencial Santana', 'Rua Um, Residencial Santana, Ipuã-SP', 'Lote plano em bairro residencial, ideal para construir a casa própria.', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85', 'Paulo Ribeiro', '(16) 93333-1234', -20.4462, -48.0117),
  ('Casa nova com varanda', 'venda', 'R$ 365.000', 3, 2, 132, 'Vila Nova', 'Rua das Flores, Vila Nova, Ipuã-SP', 'Casa nova com varanda, acabamento moderno e ambientes integrados.', 'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=85', 'Juliana Martins', '(16) 92222-5678', -20.4445, -48.0205)
) as demo(title, type, price, bedrooms, bathrooms, area, neighborhood, address, description, image, advertiser, phone, latitude, longitude)
on true
where u.email = 'mateus_ipua@hotmail.com'
  and not exists (
    select 1 from public.listings existing
    where existing.title = demo.title and existing.address = demo.address
  );
