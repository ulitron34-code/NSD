import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { uiText } from '../utils/runtimeCopy';

export default function SearchAndFilter({ 
  data = [], 
  onFilter, 
  searchFields = ['name', 'applicant', 'sector'],
  placeholder = 'Buscar...'
}) {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    sector: '',
    risk: '',
    scoreMin: '',
    scoreMax: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const statuses = [...new Set(data.map(d => d.status).filter(Boolean))];
    const sectors = [...new Set(data.map(d => d.sector).filter(Boolean))];
    const risks = [...new Set(data.map(d => d.risk).filter(Boolean))];
    
    return { statuses, sectors, risks };
  }, [data]);

  // Filter and search logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        searchFields.some(field => 
          String(item[field] || '').toLowerCase().includes(term)
        )
      );
    }

    // Apply filters
    if (filters.status) {
      result = result.filter(d => d.status === filters.status);
    }
    if (filters.sector) {
      result = result.filter(d => d.sector === filters.sector);
    }
    if (filters.risk) {
      result = result.filter(d => d.risk === filters.risk);
    }
    if (filters.scoreMin) {
      result = result.filter(d => (d.averageScore || 0) >= parseInt(filters.scoreMin));
    }
    if (filters.scoreMax) {
      result = result.filter(d => (d.averageScore || 0) <= parseInt(filters.scoreMax));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'score':
          comparison = (b.averageScore || 0) - (a.averageScore || 0);
          break;
        case 'amount':
          comparison = (b.amount || 0) - (a.amount || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return result;
  }, [data, searchTerm, filters, sortBy, sortOrder, searchFields]);

  // Notify parent of filtered results
  React.useEffect(() => {
    onFilter?.(filteredData);
  }, [filteredData, onFilter]);

  const clearFilters = () => {
    setFilters({
      status: '',
      sector: '',
      risk: '',
      scoreMin: '',
      scoreMax: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || searchTerm;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Search Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search Input */}
        <div style={{ 
          flex: '1 1 280px',
          position: 'relative'
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: '10px',
              border: `1px solid ${COLORS.border}`,
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = COLORS.gold}
            onBlur={(e) => e.target.style.borderColor = COLORS.border}
          />
          <span style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: COLORS.textMuted,
            fontSize: '1rem'
          }}>
            🔍
          </span>
        </div>

        {/* Sort Dropdown */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSortBy(by);
            setSortOrder(order);
          }}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: `1px solid ${COLORS.border}`,
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            fontSize: '0.9rem',
            cursor: 'pointer',
            minWidth: '160px'
          }}
        >
          <option value="date-desc">{L('Más recientes', 'Most recent')}</option>
          <option value="date-asc">{L('Más antiguos', 'Oldest')}</option>
          <option value="name-asc">{L('Nombre A-Z', 'Name A-Z')}</option>
          <option value="name-desc">{L('Nombre Z-A', 'Name Z-A')}</option>
          <option value="score-desc">{L('Mayor score', 'Highest score')}</option>
          <option value="score-asc">{L('Menor score', 'Lowest score')}</option>
          <option value="amount-desc">{L('Mayor monto', 'Highest amount')}</option>
          <option value="amount-asc">{L('Menor monto', 'Lowest amount')}</option>
        </select>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            border: showFilters ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
            background: showFilters ? `${COLORS.gold}20` : COLORS.white,
            color: COLORS.navy,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <span>⚙️</span>
          {L('Filtros', 'Filters')}
          {hasActiveFilters && (
            <span style={{
              background: COLORS.gold,
              color: COLORS.navy,
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 900
            }}>
              !
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: COLORS.red,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {L('Limpiar', 'Clear')}
          </button>
        )}

        {/* Results Count */}
        <span style={{ 
          color: COLORS.textMuted, 
          fontSize: '0.85rem',
          marginLeft: 'auto'
        }}>
          {filteredData.length} {L('resultados', 'results')}
        </span>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          borderRadius: '12px',
          padding: '1.5rem',
          border: `1px solid ${COLORS.border}`,
          boxShadow: COLORS.shadowSm,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          {/* Status Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: COLORS.textMuted,
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              {L('Estado', 'Status')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '0.9rem'
              }}
            >
              <option value="">{L('Todos', 'All')}</option>
              {filterOptions.statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: COLORS.textMuted,
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              {L('Sector', 'Sector')}
            </label>
            <select
              value={filters.sector}
              onChange={(e) => setFilters(f => ({ ...f, sector: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '0.9rem'
              }}
            >
              <option value="">{L('Todos', 'All')}</option>
              {filterOptions.sectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: COLORS.textMuted,
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              {L('Riesgo', 'Risk')}
            </label>
            <select
              value={filters.risk}
              onChange={(e) => setFilters(f => ({ ...f, risk: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '0.9rem'
              }}
            >
              <option value="">{L('Todos', 'All')}</option>
              {filterOptions.risks.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Score Range */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: COLORS.textMuted,
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              {L('Score min', 'Min score')}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.scoreMin}
              onChange={(e) => setFilters(f => ({ ...f, scoreMin: e.target.value }))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: COLORS.textMuted,
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              {L('Score max', 'Max score')}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.scoreMax}
              onChange={(e) => setFilters(f => ({ ...f, scoreMax: e.target.value }))}
              placeholder="100"
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}