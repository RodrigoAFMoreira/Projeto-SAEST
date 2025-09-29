// Elemento de gerenciamento de certificações do usuário, incluindo upload, listagem, download e remoção de certificados em PDF

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../src/config/supabaseClient'; 
import LoadingSpinner from './componentes/carregando'; 
import './css/certificacao.css';

const CertificacaoUser = () => {
  const [user, setUser] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        setUser(user);
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchCertifications = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('certifications')
          .select('id, title, file_path, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCertifications(data || []);
      } catch (err) {
        console.error('Erro ao carregar certificações:', err);
      }
    };
    fetchCertifications();
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      setError('Por favor, selecione um arquivo PDF.');
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      setError('Por favor, insira um título e selecione um arquivo PDF.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: insertData, error: insertError } = await supabase
        .from('certifications')
        .insert([
          {
            user_id: user.id,
            title,
            file_path: fileName,
          },
        ])
        .select();

      if (insertError) throw insertError;

      setCertifications([insertData[0], ...certifications]);
      setFile(null);
      setTitle('');
      document.getElementById('file-input').value = ''; boire
    } catch (err) {
      console.error('Erro ao enviar o certificado:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (date) {
      return new Date(date).toLocaleString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });
    }
    return 'Data não disponível';
  };

  const handleDownload = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);
      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar o certificado:', err);
    }
  };

  const handleRemove = async (certId, filePath) => {
    try {
      const { error: deleteError } = await supabase
        .from('certifications')
        .delete()
        .eq('id', certId);

      if (deleteError) throw deleteError;
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;
      setCertifications(certifications.filter((cert) => cert.id !== certId));
    } catch (err) {
      console.error('Erro ao remover o certificado:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <main className="certifications-content">
      <h2>Certificações</h2>
      <div className="upload-section">
        <h3>Adicionar Certificação</h3>
        <input
          type="text"
          placeholder="Título do certificado"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          id="file-input"
          className="file-input"
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? 'Enviando...' : 'Adicionar Certificação'}
        </button>
      </div>
      <div className="certifications-list">
        <h3>Suas Certificações</h3>
        {certifications.length === 0 ? (
          <p>Nenhuma certificação encontrada.</p>
        ) : (
          <ul>
            {certifications.map((cert) => (
              <li key={cert.id}>
                <span>{cert.title}</span>
                <span>{formatDate(cert.created_at)}</span>
                <button onClick={() => handleDownload(cert.file_path)}>
                  Baixar
                </button>
                <button onClick={() => handleRemove(cert.id, cert.file_path)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default CertificacaoUser;