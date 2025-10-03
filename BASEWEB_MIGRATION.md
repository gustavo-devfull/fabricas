# Base Web React UI Framework - Guia de Migração

## Visão Geral
O projeto foi migrado do React Bootstrap para o Base Web React UI framework da Uber. O Base Web oferece componentes mais modernos, customizáveis e com melhor performance.

## Instalação
```bash
npm install baseui styletron-react styletron-engine-atomic
```

## Configuração

### 1. Provider Principal (main.jsx)
```jsx
import { BaseWebProvider } from './theme/BaseWebProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BaseWebProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BaseWebProvider>
  </React.StrictMode>,
);
```

### 2. Tema Personalizado (theme/baseweb-theme.js)
- Cores personalizadas para o projeto
- Tipografia customizada
- Bordas e espaçamentos ajustados

## Componentes Migrados

### Card
**Antes (React Bootstrap):**
```jsx
<Card className="shadow-sm">
  <Card.Body className="p-3">
    Conteúdo
  </Card.Body>
</Card>
```

**Depois (Base Web):**
```jsx
<BaseCard
  overrides={{
    Root: {
      style: {
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        ':hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        }
      }
    },
    Body: {
      style: {
        padding: '12px'
      }
    }
  }}
>
  Conteúdo
</BaseCard>
```

### Button
**Antes (React Bootstrap):**
```jsx
<Button variant="outline-danger" size="sm">
  Excluir
</Button>
```

**Depois (Base Web):**
```jsx
<BaseButton
  kind="secondary"
  size="mini"
  overrides={{
    BaseButton: {
      style: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        ':hover': {
          backgroundColor: '#c82333'
        }
      }
    }
  }}
>
  Excluir
</BaseButton>
```

### Checkbox
**Antes (React Bootstrap):**
```jsx
<div className="form-check">
  <input
    className="form-check-input"
    type="checkbox"
    checked={checked}
    onChange={onChange}
  />
  <label className="form-check-label">Label</label>
</div>
```

**Depois (Base Web):**
```jsx
<Checkbox
  checked={checked}
  onChange={onChange}
  overrides={{
    Root: {
      style: {
        marginRight: '8px'
      }
    },
    Label: {
      style: {
        fontSize: '0.75rem',
        color: '#6c757d',
        cursor: 'pointer'
      }
    }
  }}
>
  Label
</Checkbox>
```

### Input
**Antes (React Bootstrap):**
```jsx
<Form.Control
  type="number"
  value={value}
  onChange={onChange}
  style={{ width: '60px', fontSize: '0.8rem' }}
/>
```

**Depois (Base Web):**
```jsx
<Input
  type="number"
  value={value}
  onChange={onChange}
  overrides={{
    Input: {
      style: {
        width: '60px',
        fontSize: '0.8rem',
        textAlign: 'center'
      }
    }
  }}
/>
```

### Badge/Tag
**Antes (React Bootstrap):**
```jsx
<Badge 
  className="px-1 py-1"
  style={{
    fontSize: '0.65rem',
    backgroundColor: '#28a745'
  }}
>
  Ativa
</Badge>
```

**Depois (Base Web):**
```jsx
<Tag
  closeable={false}
  variant="positive"
  overrides={{
    Root: {
      style: {
        fontSize: '0.65rem',
        borderRadius: '12px',
        fontWeight: '600',
        paddingLeft: '8px',
        paddingRight: '8px'
      }
    }
  }}
>
  Ativa
</Tag>
```

## Vantagens do Base Web

### 1. **Customização Avançada**
- Sistema de overrides poderoso
- Estilos inline com suporte a pseudo-seletores
- Temas personalizáveis

### 2. **Performance**
- Styletron para CSS-in-JS otimizado
- Componentes leves e eficientes
- Tree-shaking automático

### 3. **Acessibilidade**
- Componentes com ARIA built-in
- Navegação por teclado
- Suporte a screen readers

### 4. **TypeScript**
- Tipagem completa
- IntelliSense melhorado
- Menos erros em runtime

## Próximos Passos

### Componentes Restantes para Migrar:
- [ ] Modal (BaseWeb Modal)
- [ ] Alert (BaseWeb Banner)
- [ ] Spinner (BaseWeb Spinner)
- [ ] Table (BaseWeb Table)
- [ ] Form (BaseWeb FormControl)

### Melhorias Futuras:
- [ ] Dark mode com Base Web
- [ ] Animações com Base Web Motion
- [ ] Data visualization com Base Web Charts
- [ ] Responsive design otimizado

## Recursos Úteis

- [Documentação Base Web](https://baseweb.design/)
- [Componentes Disponíveis](https://baseweb.design/components/)
- [Sistema de Temas](https://baseweb.design/guides/theming/)
- [Exemplos de Código](https://baseweb.design/examples/)

## Troubleshooting

### Problemas Comuns:
1. **Styletron não funciona**: Verificar se o provider está configurado
2. **Estilos não aplicam**: Verificar se os overrides estão corretos
3. **Performance lenta**: Verificar se não há re-renders desnecessários

### Debug:
```jsx
// Para debug de temas
import { useStyletron } from 'baseui';

const [css, theme] = useStyletron();
console.log('Current theme:', theme);
```
