-- Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Corrigir função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  -- Criar categorias padrão
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
  (NEW.id, 'Alimentação', 'expense', 'utensils', '#EF4444'),
  (NEW.id, 'Transporte', 'expense', 'car', '#F97316'),
  (NEW.id, 'Lazer', 'expense', 'gamepad-2', '#8B5CF6'),
  (NEW.id, 'Saúde', 'expense', 'heart', '#EC4899'),
  (NEW.id, 'Educação', 'expense', 'book', '#3B82F6'),
  (NEW.id, 'Moradia', 'expense', 'home', '#6B7280'),
  (NEW.id, 'Salário', 'income', 'dollar-sign', '#10B981'),
  (NEW.id, 'Investimentos', 'income', 'trending-up', '#059669');
  
  -- Criar conta padrão
  INSERT INTO public.accounts (user_id, name, balance) VALUES
  (NEW.id, 'Conta Principal', 0);
  
  RETURN NEW;
END;
$$;