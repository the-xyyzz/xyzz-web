const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'lib')));

const API_KEY = 'sylphy-a6a203';
const BASE_URL = 'https://sylphy.xyz';

app.get('/api/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL faltante');
    try {
        const response = await axios({
            method: 'get',
            url: decodeURIComponent(url),
            responseType: 'stream',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://www.instagram.com/'
            }
        });
        
        const contentType = url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') || url.toLowerCase().includes('.png') 
            ? 'image/jpeg' 
            : 'video/mp4';
            
        res.setHeader('Content-Type', contentType);
        response.data.pipe(res);
    } catch (e) { res.status(500).send('Error en el túnel'); }
});

app.post('/api/download', async (req, res) => {
    const { url, platform } = req.body;
    let endpoint = `${BASE_URL}/download/${platform === 'youtube' ? 'ytmp4' : platform}?url=${encodeURIComponent(url)}&api_key=${API_KEY}`;
    
    try {
        const response = await axios.get(endpoint);
        const data = response.data;
        let finalUrl = '';

        if (platform === 'tiktok') {
            finalUrl = data.result?.hdplay || data.result?.play;
        } 
        else if (platform === 'instagram') {
            if (Array.isArray(data.result)) {
                finalUrl = data.result.find(link => link.toLowerCase().includes('.mp4')) || data.result[0];
            } else {
                finalUrl = data.result;
            }
        } 
        else if (platform === 'facebook') {
            finalUrl = data.result?.hd || data.result?.sd || data.result;
        } 
        else if (platform === 'youtube') {
            finalUrl = data.result?.dl_url || data.url;
        }

        res.json({ downloadUrl: finalUrl });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`${BASE_URL}/search/tiktok?q=${encodeURIComponent(q)}&api_key=${API_KEY}`);
        res.json(response.data.result || []);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/search/pinterest', async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`${BASE_URL}/search/pinterest?q=${encodeURIComponent(q)}&api_key=${API_KEY}`);
        res.json(response.data.result || []);
    } catch (e) { 
        res.status(500).json({ error: 'Error en búsqueda de Pinterest' }); 
    }
});

app.get('/api/search/spotify', async (req, res) => {
    const { q } = req.query;
    try {
        const response = await axios.get(`${BASE_URL}/search/spotify?q=${encodeURIComponent(q)}&api_key=${API_KEY}`);
        res.json(response.data.result || []);
    } catch (e) {
        res.status(500).json({ error: 'Error en búsqueda de Spotify' });
    }
});

module.exports = app;
