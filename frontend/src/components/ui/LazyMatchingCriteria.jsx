import React from 'react';

const LazyMatchingCriteria = ({ criteria }) => {
  return (
    <div className="bg-white rounded-xl border border-warmGray-200 p-4 sm:p-6 shadow-md">
      <h3 className="text-base sm:text-lg font-semibold text-warmGray-900 mb-4">
        Matching Criteria ({criteria.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {criteria.map((criteriaItem, index) => (
          <div
            key={index}
            className="bg-warmGray-50 border border-warmGray-200 rounded-lg p-3 hover:bg-warmGray-100 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="font-medium text-warmGray-900 capitalize text-sm sm:text-base truncate">
                {criteriaItem.attribute_key?.replace('_', ' ')}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium self-start sm:self-auto ${
                criteriaItem.rule === 'same' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {criteriaItem.rule === 'same' ? 'Same' : 'Different'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LazyMatchingCriteria;
