#!/usr/bin/env node

/**
 * Logout Script
 * Bu betik Supabase oturumunu kapatır ve yerel depolamayı temizler
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// ES modules için __dirname alternatifi
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env dosyasını manuel olarak oku
const envPath = join(__dirname, '..', '.env');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.error('❌ .env dosyası okunamadı:', error.message);
  process.exit(1);
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables bulunamadı!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Mevcut' : '❌ Eksik');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Mevcut' : '❌ Eksik');
  process.exit(1);
}

// Supabase client oluştur
const supabase = createClient(supabaseUrl, supabaseKey);

async function logout() {
  try {
    console.log('🔄 Oturum kapatılıyor...');
    
    // Mevcut oturumu kontrol et
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Oturum kontrolü hatası:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('ℹ️ Zaten oturum açık değil');
      return;
    }
    
    console.log('👤 Mevcut kullanıcı:', session.user.email);
    
    // Oturumu kapat
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Logout hatası:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Oturum başarıyla kapatıldı!');
    console.log('🔄 Tarayıcınızı yenileyin veya uygulamayı yeniden başlatın');
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error.message);
    process.exit(1);
  }
}

// Betiği çalıştır
logout();