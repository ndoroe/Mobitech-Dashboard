import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export interface Filter {
  id: string;
  field: string;
  operator: string;
  value: any;
}

interface FilterBuilderProps {
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  availableFields?: Array<{ name: string; type: string; label: string }>;
  availableOperators?: Array<{ value: string; label: string }>;
}

const DEFAULT_FIELDS = [
  { name: 'dataUsed', type: 'decimal', label: 'Data Used (MB)' },
  { name: 'dataSize', type: 'decimal', label: 'Data Size (MB)' },
  { name: 'usagePercent', type: 'decimal', label: 'Usage Percent (%)' },
  { name: 'lastConnection', type: 'datetime', label: 'Last Connection' },
  { name: 'iccid', type: 'string', label: 'ICCID' },
  { name: 'msisdn', type: 'string', label: 'MSISDN' },
];

const DEFAULT_OPERATORS = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'LIKE', label: 'Contains' },
  { value: 'BETWEEN', label: 'Between' },
];

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filters,
  onFiltersChange,
  availableFields = DEFAULT_FIELDS,
  availableOperators = DEFAULT_OPERATORS,
}) => {
  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: availableFields.length > 0 ? availableFields[0].name : '',
      operator: availableOperators.length > 0 ? availableOperators[0].value : '',
      value: '',
    };
    onFiltersChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    onFiltersChange(
      filters.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const getFieldType = (fieldName: string): string => {
    const field = availableFields.find(f => f.name === fieldName);
    return field?.type || 'string';
  };

  const getOperatorsForField = (fieldName: string) => {
    const fieldType = getFieldType(fieldName);
    if (fieldType === 'string') {
      return availableOperators.filter(op => 
        ['=', '!=', 'LIKE', 'NOT LIKE'].includes(op.value)
      );
    }
    return availableOperators;
  };

  const renderValueInput = (filter: Filter) => {
    const fieldType = getFieldType(filter.field);

    if (filter.operator === 'BETWEEN') {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
          <TextField
            size="small"
            type={fieldType === 'decimal' ? 'number' : fieldType === 'datetime' ? 'date' : 'text'}
            value={Array.isArray(filter.value) ? filter.value[0] : ''}
            onChange={(e) => {
              const currentValue = Array.isArray(filter.value) ? filter.value : ['', ''];
              updateFilter(filter.id, { value: [e.target.value, currentValue[1]] });
            }}
            placeholder="From"
            sx={{ flex: 1 }}
            InputLabelProps={fieldType === 'datetime' ? { shrink: true } : undefined}
          />
          <Typography variant="body2">and</Typography>
          <TextField
            size="small"
            type={fieldType === 'decimal' ? 'number' : fieldType === 'datetime' ? 'date' : 'text'}
            value={Array.isArray(filter.value) ? filter.value[1] : ''}
            onChange={(e) => {
              const currentValue = Array.isArray(filter.value) ? filter.value : ['', ''];
              updateFilter(filter.id, { value: [currentValue[0], e.target.value] });
            }}
            placeholder="To"
            sx={{ flex: 1 }}
            InputLabelProps={fieldType === 'datetime' ? { shrink: true } : undefined}
          />
        </Box>
      );
    }

    return (
      <TextField
        size="small"
        type={fieldType === 'decimal' ? 'number' : fieldType === 'datetime' ? 'date' : 'text'}
        value={filter.value}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        placeholder="Value"
        sx={{ flex: 1 }}
        InputLabelProps={fieldType === 'datetime' ? { shrink: true } : undefined}
      />
    );
  };

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 2,
        gap: 1
      }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Filter Builder</Typography>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={addFilter}
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Filter
        </Button>
      </Box>

      {filters.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No filters applied. Click "Add Filter" to create one.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filters.map((filter, index) => (
          <Box key={filter.id}>
            {index > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                <Chip label="AND" size="small" color="primary" />
              </Box>
            )}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1, 
              alignItems: { xs: 'stretch', sm: 'center' } 
            }}>
              <FormControl size="small" sx={{ minWidth: { sm: 150 }, flex: { xs: 1, sm: 'none' } }}>
                <InputLabel>Field</InputLabel>
                <Select
                  value={filter.field}
                  label="Field"
                  onChange={(e: SelectChangeEvent) => {
                    updateFilter(filter.id, { 
                      field: e.target.value,
                      operator: '>=',
                      value: ''
                    });
                  }}
                >
                  {availableFields.map((field) => (
                    <MenuItem key={field.name} value={field.name}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { sm: 120 }, flex: { xs: 1, sm: 'none' } }}>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={filter.operator}
                  label="Operator"
                  onChange={(e: SelectChangeEvent) => {
                    const newOp = e.target.value;
                    updateFilter(filter.id, { 
                      operator: newOp,
                      value: newOp === 'BETWEEN' ? ['', ''] : ''
                    });
                  }}
                >
                  {getOperatorsForField(filter.field).map((op) => (
                    <MenuItem key={op.value} value={op.value}>
                      {op.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {renderValueInput(filter)}

              <IconButton
                color="error"
                onClick={() => removeFilter(filter.id)}
                size="small"
                sx={{ alignSelf: { xs: 'center', sm: 'auto' } }}
              >
                <IconTrash size={18} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default FilterBuilder;
