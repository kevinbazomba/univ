/**
 * COMPOSANT FILTRES
 */

import React from 'react';
import { Space, Input, Select, Button, DatePicker } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Filtres = ({
  searchPlaceholder = 'Rechercher...',
  onSearch,
  onReset,
  filters = [],
  onFilterChange,
  showDateRange = false,
  onDateRangeChange
}) => {
  return (
    <Space wrap style={{ marginBottom: 16 }}>
      <Search
        placeholder={searchPlaceholder}
        onSearch={onSearch}
        style={{ width: 200 }}
        prefix={<SearchOutlined />}
      />

      {filters.map((filter, index) => (
        <Select
          key={index}
          placeholder={filter.placeholder}
          style={{ width: 150 }}
          allowClear
          onChange={(value) => onFilterChange(filter.name, value)}
        >
          {filter.options.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      ))}

      {showDateRange && (
        <RangePicker onChange={onDateRangeChange} />
      )}

      <Button icon={<ReloadOutlined />} onClick={onReset}>
        Réinitialiser
      </Button>
    </Space>
  );
};

export default Filtres;