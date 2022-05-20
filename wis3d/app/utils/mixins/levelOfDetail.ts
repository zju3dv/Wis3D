export const levelOfDetail = {
    LOD: { maxPoints: 1, maxDepth: 80 },
    /**
     * Set the vanted level of detail (LOD).
     * @param {number} [maxPoints=1] Number of distinct points per octant in octree before it splits up.
     * @param {number} [maxDepth=8] The maximum octree depth level, starting at 0.
     */
    setLOD (maxPoints, maxDepth) {
      if (typeof maxPoints !== 'undefined') {
        this.LOD.maxPoints = maxPoints;
      }
      if (typeof maxDepth !== 'undefined') {
        this.LOD.maxDepth = maxDepth;
      }
    },
    /**
     * Get the Level Of Detail (LOD) value.
     */
    getLOD() {
      return this.LOD;
    }
  };