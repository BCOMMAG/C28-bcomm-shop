-- Habilitar REPLICA IDENTITY FULL para garantir dados completos nos eventos de UPDATE e DELETE
ALTER TABLE public.reservas_estoque REPLICA IDENTITY FULL;
ALTER TABLE public.variacoes_produto REPLICA IDENTITY FULL;
ALTER TABLE public.produtos REPLICA IDENTITY FULL;
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
ALTER TABLE public.itens_pedido REPLICA IDENTITY FULL;

-- Incluir tabelas na publicação nativa do Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservas_estoque'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas_estoque;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'variacoes_produto'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.variacoes_produto;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'produtos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'itens_pedido'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_pedido;
  END IF;
END $$;
